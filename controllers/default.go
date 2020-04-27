package controllers

import (
	"chatRoom/utils"
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
		relativePath := utils.GetRelativePath()
		prodPath := utils.LoadStaticRelativePath(relativePath, "/static")
		c.Data["prodPath"] = prodPath
	}
	c.TplName = "index.html"
}
