package controllers

import (
	"encoding/json"
	"fmt"
	"github.com/astaxie/beego"
	"github.com/gorilla/websocket"
	"net/http"
	"sort"
	"strings"
)

type ServerController struct {
	beego.Controller
}

type OnlineClient struct {
	Name string `json:"name"`
	Rand int    `json:"rand"`
}

type OnlineClients []OnlineClient

func (c *ServerController) Post() {
	name := c.GetString("name")
	random, _ := c.GetInt("rand")
	if len(name) == 0 {
		beego.Error("name is NULL")
		c.Redirect("/chatRoom", 302)
		return
	}

	beego.Info("get name:" + name + ", and send to chatRoom.html")
	c.Data["name"] = name
	c.Data["rand"] = random
	c.Data["prodPath"] = ""
	if strings.EqualFold("prod", beego.BConfig.RunMode) {
		fmt.Println("in prod mode, using prod path.")
		c.Data["prodPath"] = "/prod"
	}
	c.TplName = "chatRoom.html"
}

// 用于与用户间的websocket连接(chatRoom.html发送来的websocket请求)
func (c *ServerController) WS() {
	name := c.GetString("name")
	random, _ := c.GetInt("rand")
	if len(name) == 0 {
		beego.Error("name is NULL")
		c.Redirect("/chatRoom", 302)
		return
	}

	// 检验http头中upgrader属性，若为websocket，则将http协议升级为websocket协议
	conn, err := (&websocket.Upgrader{
		// 解决跨域问题
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}).Upgrade(c.Ctx.ResponseWriter, c.Ctx.Request, nil)

	if _, ok := err.(websocket.HandshakeError); ok {
		beego.Error("Not a websocket connection", err)
		http.Error(c.Ctx.ResponseWriter, "Not a websocket handshake", 400)
		return
	} else if err != nil {
		beego.Error("Cannot setup WebSocket connection:", err)
		return
	}

	var client Client
	client.name = name
	client.rand = random
	client.conn = conn

	// 如果用户列表中没有该用户
	if !clients[client] {
		join <- client
		beego.Info("user:", client.name, "websocket connect success!")
	}

	// 当函数返回时，将该用户加入退出通道，并断开用户连接
	defer func() {
		leave <- client
		client.conn.Close()
	}()

	// 由于WebSocket一旦连接，便可以保持长时间通讯，则该接口函数可以一直运行下去，直到连接断开
	for {
		// 读取消息。如果连接断开，则会返回错误
		_, msgStr, err := client.conn.ReadMessage()

		// 如果返回错误，就退出循环
		if err != nil {
			break
		}
		var msg Message
		msg.Name = client.name
		msg.Rand = client.rand
		msg.Message = string(msgStr)

		if string(msgStr) != "PING" {
			beego.Info("WS-----------receive: " + string(msgStr))
			//如果没有错误，则把用户发送的信息放入message通道中
			msg.EventType = 0
			message <- msg
		} else {
			msg.EventType = 3
			var alive KeepAlive
			alive.msg = msg
			alive.client = client
			keepAlive <- alive
		}
	}

	// cannot find template bug fixed
	c.TplName = "index.html"
}

func (c *ServerController) GetOnlineList() {
	c.TplName = "chatRoom.html"
	if clients != nil && len(clients) > 0 {
		var onlineClientList OnlineClients
		for client, inRoom := range clients {
			if inRoom {
				var onlineClient OnlineClient
				onlineClient.Name = client.name
				onlineClient.Rand = client.rand
				onlineClientList = append(onlineClientList, onlineClient)
			}
		}
		Sort(onlineClientList)
		data, err := json.Marshal(onlineClientList)
		if err != nil {
			beego.Error("Fail to marshal clients list:", err)
			return
		}
		c.Ctx.WriteString(string(data))
	}
}

func (o OnlineClients) Len() int {
	return len(o)
}

// 在比较的方法中，定义排序的规则
func (o OnlineClients) Less(i, j int) bool {
	if o[i].Name < o[j].Name {
		return true
	} else if o[i].Name > o[j].Name {
		return false
	} else {
		return o[i].Rand < o[i].Rand
	}
}

func (o OnlineClients) Swap(i, j int) {
	temp := o[i]
	o[i] = o[j]
	o[j] = temp
}

func Sort(s sort.Interface) {
	length := s.Len()
	for i := 0; i < length; i++ {
		minIndex := i
		for j := i + 1; j < length; j++ {
			if s.Less(j, i) {
				minIndex = j
			}
		}
		s.Swap(minIndex, i)
	}
}
