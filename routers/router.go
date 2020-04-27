package routers

import (
	"chatRoom/controllers"
	"github.com/astaxie/beego"
)

func init() {
	beego.Router("/chatRoom/welcome", &controllers.MainController{})
	beego.Router("/chatRoom/chat", &controllers.ServerController{})
	beego.Router("/chatRoom/WS", &controllers.ServerController{}, "get:WS")
}
