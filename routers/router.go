package routers

import (
	"chatRoom/controllers"
	"github.com/astaxie/beego"
)

func init() {
	beego.Router("/cr", &controllers.MainController{})
	beego.Router("/chatRoom", &controllers.ServerController{})
	beego.Router("/chatRoom/WS", &controllers.ServerController{}, "get:WS")
}
