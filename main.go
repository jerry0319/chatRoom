package main

import (
	_ "chatRoom/routers"
	"github.com/astaxie/beego"
)

func main() {
	beego.BConfig.WebConfig.AutoRender = false

	beego.Run()
}
