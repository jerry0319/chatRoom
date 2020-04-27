package main

import (
	_ "chatRoom/routers"
	"github.com/astaxie/beego"
)

func main() {
	beego.SetStaticPath("/css", "static/css")
	beego.SetStaticPath("/img", "static/img")
	beego.SetStaticPath("/js", "static/js")

	beego.Run()
}
