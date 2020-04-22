package routers

import (
	"chatRoom/controllers"
	"github.com/astaxie/beego"
)

func init() {
	beego.Router("/", &controllers.MainController{})
	beego.Router("/cr/chatRoom", &controllers.ServerController{})
	beego.Router("/cr/chatRoom/WS", &controllers.ServerController{}, "get:WS")
}
