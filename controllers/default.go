package controllers

import (
	"github.com/astaxie/beego"
	"strings"
)

type MainController struct {
	beego.Controller
}

func (c *MainController) Get() {
	c.Data["prodPath"] = ""
	if strings.EqualFold("prod", beego.BConfig.RunMode) {
		c.Data["prodPath"] = "/prod"
	}
	c.TplName = "index.html"
}
