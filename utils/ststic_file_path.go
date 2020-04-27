package utils

import (
	"github.com/astaxie/beego"
	"os"
	"os/exec"
	"path/filepath"
)

func GetRelativePath() string {
	path, _ := exec.LookPath(os.Args[0])
	fileFullPath, _ := filepath.Abs(path)
	relativePath := filepath.Dir(fileFullPath)
	return relativePath
}

func LoadStaticRelativePath(relativePath string, target string) string {
	StaticDirMap := beego.BConfig.WebConfig.StaticDir
	for url, path := range StaticDirMap {
		if url == target {
			return filepath.Join(relativePath, path)
		}
	}
	return ""
}
