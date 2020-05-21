package routers

import (
	"chatRoom/controllers"
	"github.com/astaxie/beego"
)

func init() {
	beego.Router("/chatRoom", &controllers.MainController{})
	beego.Router("/chatRoom/chat", &controllers.ServerController{})
	beego.Router("/chatRoom/WS", &controllers.ServerController{}, "get:WS")
	beego.Router("/chatRoom/getOnlineList", &controllers.ServerController{}, "get:GetOnlineList")
}
