package controllers

import (
	"fmt"
	"github.com/astaxie/beego"
	"strings"
)

type MainController struct {
	beego.Controller
}

func (c *MainController) Get() {
	c.Data["prodPath"] = ""
	if strings.EqualFold("prod", beego.BConfig.RunMode) {
		fmt.Println("in prod mode, using prod path.")
		c.Data["prodPath"] = "/chatRoom/"
	}
	c.TplName = "index.html"
}
