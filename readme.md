# koishi-plugin-onebot-info-image

[![npm](https://img.shields.io/npm/v/koishi-plugin-onebot-info-image?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-onebot-info-image)

获取成员信息/管理员列表，发送文字/图片/合并转发消息，仅支持onebot

推荐使用Napcat

### 更新日志
- **0.3.1-beta.1+20251219**
  - 微调flat模板 aui的样式捏
- **0.3.0-beta.1+20251219**
  - 增加配置页面webui里面嵌入的html预览捏
- **0.2.3-beta.1+20251218**
  - 手机号可以强制隐藏捏
- **0.2.2-beta.1+20251218**
  - 新增：aui指令允许使用qq号进行查询
- **前面的版本号**
  - 忘了。反正你看到的features都是前面更新的

#### Napcat平台渲染效果:
##### 用户信息：
![https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_aui_source.png](https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_aui_source.png)
![https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_aui_lxgw.png](https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_aui_lxgw.png)
![https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_aui_flat.png](https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_aui_flat.png)
##### 群管理列表：
![https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_al_source.pnge](https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_al_source.png)
![https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_al_lxgw.png](https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_al_lxgw.png)
![https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_al_flat.png](https://gitee.com/vincent-zyu/koishi-plugin-onebot-image/releases/download/example_image/napcat_al_flat.png)

## dev 
### 查看git大文件
```shell
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | Where-Object { $_ -match '^blob' } | ForEach-Object { $parts = $_ -split ' ', 4; [PSCustomObject]@{ Size = [int]$parts[2]; Name = $parts[3] } } | Sort-Object Size -Descending | Select-Object -First 20 

git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | Where-Object { $_ -match '^blob' } | ForEach-Object { $parts = $_ -split ' ', 4; [PSCustomObject]@{ Size = [int]$parts[2]; File = $parts[3] } } | Sort-Object Size -Descending | Select-Object -First 20 | ForEach-Object { "{0,10} KB  {1}" -f ([math]::Round($_.Size/1KB, 2)), $_.File }
```

### 发布到git workflow
#### 开发环境：
```shell
cd G:\GGames\Minecraft\shuyeyun\qq-bot\koishi-dev\koishi-dev-3\external\onebot-info-image
git add .
git commit -m "message"
git push origin main
```
#### 生产环境:
```shell
cd /home/bawuyinguo/SSoftwareFiles/koishi/awa-bot-3/external
git clone https://gitee.com/vincent-zyu/koishi-plugin-onebot-image
cd /home/bawuyinguo/SSoftwareFiles/koishi/awa-bot-3/external/koishi-plugin-onebot-image
git pull
cd /home/bawuyinguo/SSoftwareFiles/koishi/awa-bot-3
yarn && yarn build
yarn
```

### 发布到npm workflow
```shell
# ensure plugin dir name is *onebot-info-image*, without koishi-plugin prefix then:
cd G:\GGames\Minecraft\shuyeyun\qq-bot\koishi-dev\koishi-dev-3
yarn
yarn dev
yarn build onebot-info-image

$Env:HTTP_PROXY = "http://127.0.0.1:7890"
$Env:HTTPS_PROXY = "http://127.0.0.1:7890"
Invoke-WebRequest -Uri "https://www.google.com" -Method Head -UseBasicParsing
npm login --registry https://registry.npmjs.org
# login npm in browser
npm run pub onebot-info-image -- --registry https://registry.npmjs.org
npm dist-tag add koishi-plugin-onebot-info-image@0.3.1-beta.1+20251219 latest --registry https://registry.npmjs.org

npm view koishi-plugin-onebot-info-image
npm-stat.com
```