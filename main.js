class WebEdit {
  constructor() {
    this.container = document.getElementById("container");
    this.editWrap = document.getElementById("editWrap");
    this.comInfo = null;//所有組件
    this.pageCOMs = [];//頁面所有元件
    this.rule = null;
    this.init();
    this.loadRule();
  }

  /**初始化左側元件 */
  init() {
    let comWrap = document.getElementById("comWrap");
    let xhr = new XMLHttpRequest();
    xhr.open("get", "./test.json");
    xhr.onload = () => {
      this.comInfo = JSON.parse(xhr.response);
      let str = "";
      if (this.comInfo.length > 0) {
        this.comInfo.forEach((item) => {
          str += `<li class="com" draggable="true" data-id="${item.ID}"><span>${item.Name}</span></li>`;
          //item.HtmlJson = JSON.parse(item.HtmlJson.replace(/(?:\\[rn]|[\r\n]+)+| /g, ""));
          //console.log(item);
        });
        comWrap.innerHTML = str;
        this.addEvent();
      }
    };

    xhr.send();
  }

  loadRule() {
    let xhr = new XMLHttpRequest();
    xhr.open("get", "./editRule.json");
    xhr.onload = () => {
      this.rule = JSON.parse(xhr.response).rule;
    };

    xhr.send();
  }

  /**
 * 轉換成html字串
 * @param {object} obj 
 * @returns {string} html
 */
  parseHtml(obj, id) {
    let html = `<${obj.ele} data-id="${id}"${this.parseAttr(obj.attr, obj.style)}${obj.text}`;
    if (obj.sub.length > 0) {
      obj.sub.forEach((item, index) => {
        html += this.parseHtml(item, id + "-" + (index + 1));
      });
    }
    switch (obj.ele) {
      case "img":
      case "input":
        html += "/>";
        break;
      default:
        html += `</${obj.ele}>`;
    }
    return html;
  }


  /**
   * 轉換html屬性成字串
   * @param {Object} obj1 html屬性
   * @param {Object} obj2 html樣式
   */
  parseAttr(obj1, obj2) {
    let attr = "";
    let style = "";

    if (obj1 !== undefined) {
      Object.keys(obj1).map((item) => {
        attr += `${" " + item}="${obj1[item]}"`;
      });
    }

    if (obj2 !== undefined) {
      Object.keys(obj2).map((item) => {
        style += ` style="${item}:${obj2[item]}"`;
      });
    }
    return attr + style + ">";
  }

  /**元件的事件*/
  addEvent() {
    let com = document.getElementsByClassName("com") || [];
    let menuBTN = (com.length > 0) ? SystemMenu(com) : [];//右鍵系統管理欄按鈕

    for (let item of com) {
      //拖曳開始
      item.ondragstart = function (e) {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', this.dataset.id);
        this.style.opacity = 0.5;
      };

      //拖曳結束
      item.ondragend = function () {
        this.style.opacity = 1;
      };

      //右鍵選單
      item.addEventListener("contextmenu", function () {
        menuBTN.forEach(itemBTN => {
          switch (itemBTN.name) {
            case "編輯":
              itemBTN.ele.onclick = () => {
                //Popup({ url: `/WebEdit/MoreCOM?ID=${this.dataset.id}` });
              };
              break;

            case "刪除":
              itemBTN.ele.onclick = () => {
                //AlertWindow({ info: "確定刪除?", status: "confirm" }).then(() => {
                //	ajaxData({ id: this.id }, "/WebEdit/Delete");
                //});
              };
              break;
          }
        });
      });
    }

    this.container.ondrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.dataset.drag || e.target === this.container) {
        let id = e.dataTransfer.getData('text/plain');
        let currentCOM = this.comInfo.filter(item => item.ID === id);

        e.target.style.background = "";

        if (currentCOM.length > 0) {
          currentCOM = JSON.parse(JSON.stringify(currentCOM[0]));
          currentCOM.ID = this.pageCOMs.length + 1 + "";
          currentCOM.htmlStr = this.parseHtml(currentCOM.HtmlJson, currentCOM.ID);
          let comNode = document.createRange().createContextualFragment(currentCOM.htmlStr).firstChild;
          currentCOM.ele = comNode;

          comNode.onclick = (e) => {
            e.preventDefault();
            let htmlJson = this.pageCOMs.filter(item => item.ID === e.target.dataset.id.split("-")[0])[0];
            this.editArea(htmlJson);
            //console.log(htmlJson);
          };
          this.pageCOMs.push(currentCOM);
          e.target.append(comNode);
        }
        //console.log(this.pageCOMs);
      }
    };

    this.container.ondragenter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.dataset.drag || e.target === this.container) {
        e.target.style.background = "#eee";
      }
    };

    this.container.ondragleave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.dataset.drag || e.target === this.container) {
        e.target.style.background = "";
      }
    };

    this.container.ondragover = function (e) {
      e.preventDefault();
      e.stopPropagation();
    };
  }

  /**
  * 屬性編輯區
  * @param {Object} data 元素的JSON資料
  */
  editArea(data) {
    let inputs = this.editWrap.getElementsByTagName("input");
    let selects = this.editWrap.getElementsByTagName("select");
    let aa = this.rule.filter(item => item.type === data.HtmlJson.ele)[0];

    if (aa !== undefined) {
      let attrStr = "", styleStr = "";
      aa.attr.forEach(item => {
        let attrName = Object.keys(data.HtmlJson.attr).find(a => a === Object.keys(item)[1]);
        let val = (attrName) ? data.HtmlJson.attr[attrName] : "";

        attrStr += `<div><label>${item.name}：</label>`;
        if (Array.isArray(item[Object.keys(item)[1]])) {
          attrStr += `<select name="${Object.keys(item)[1]}">`;
          item[Object.keys(item)[1]].forEach(item => {
            attrStr += `<option value="${item}" ${(item === val) ? "selected" : ""}>${item}</option>`;
          });
          attrStr += "</select></div>";
        } else {
          attrStr += `<input type="text" name="${Object.keys(item)[1]}" value="${val}" data-type="attr"/></div>`;
        }
      });
      aa.style.forEach(item => {
        attrStr += `<div><label>${item.name}：</label><input type="text" name="${Object.keys(item)[1]}" value="${item[Object.keys(item)[1]]}" data-type="style"/></div>`;
      });
      this.editWrap.innerHTML = attrStr + styleStr;
    }

    for (let i = 0; i < inputs.length; i++) {
      inputs[i].onchange = (e) => {
        if (e.target.dataset.type === "attr") {
          data.ele[e.target.name] = e.target.value;
          if (data.HtmlJson.attr === undefined) {
            data.HtmlJson.attr = {};
          }
          data.HtmlJson.attr[e.target.name] = e.target.value;
        } else if (e.target.dataset.type === "style") {
          let styleName = e.target.name.split("-");
          if (styleName.length > 1) {
            styleName = styleName[0] + styleName[1].slice(0, 1).toUpperCase() + styleName[1].slice(1);
          } else {
            styleName = styleName[0];
          }
          data.ele.style[styleName] = e.target.value;
          if (data.HtmlJson.style === undefined) {
            data.HtmlJson.style = {};
          }
          data.HtmlJson.style[e.target.name] = e.target.value;
        }
        data.htmlStr = this.parseHtml(data.HtmlJson, data.ID);
      };
    }

    for (let i = 0; i < selects.length; i++) {
      selects[i].onchange = (e) => {
        data.ele[e.target.name] = e.target.value;
        if (data.HtmlJson.attr === undefined) {
          data.HtmlJson.attr = {};
        }
        data.HtmlJson.attr[e.target.name] = e.target.value;
        data.htmlStr = this.parseHtml(data.HtmlJson, data.ID);
      };
    }
  }
}

new WebEdit();