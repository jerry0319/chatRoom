package main

import (
	_ "chatRoom/routers"
	"fmt"
	"github.com/astaxie/beego"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

//添加绝对路径的支持
func MakeAbsolutePathSupport() {

	if strings.EqualFold("dev", beego.BConfig.RunMode) {
		fmt.Println("in dev mode, using default path.")
	} else {
		relativePath := GetRelativePath()
		LoadStaticRelativePath(relativePath)
		LoadViewsRelativePath(relativePath)
		//LoadConfigFileByRelativePath(relativePath,"conf/app.conf")
	}
}

func GetRelativePath() string {
	path, _ := exec.LookPath(os.Args[0])
	fileFullPath, _ := filepath.Abs(path)
	relativePath := filepath.Dir(fileFullPath)

	return relativePath
}

//使静态文件夹支持相对路径
func LoadStaticRelativePath(relativePath string) {
	StaticDirMap := beego.BConfig.WebConfig.StaticDir
	for url, path := range StaticDirMap {
		StaticDirMap[url] = filepath.Join(relativePath, path)
	}
}

//使view模板文件夹支持相对路径
func LoadViewsRelativePath(relativePath string) {
	viewsPath := filepath.Join(relativePath, beego.BConfig.WebConfig.ViewsPath)
	beego.SetViewsPath(viewsPath)
}

//通过相对路径加载配置文件
//func LoadConfigFileByRelativePath(relativePath string, confFileRelativePath string){
//	beego.AppConfigPath = filepath.Join(relativePath,confFileRelativePath)
//	beego.ParseConfig()
//}

func main() {
	MakeAbsolutePathSupport()

	beego.Run()
}
