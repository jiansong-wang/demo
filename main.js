class Drag {
  constructor() {
    this.container = document.querySelector("#container");//內容區
    this.editWrap = document.querySelector("#editWrap");//編輯區
    this.inputs = this.editWrap.getElementsByTagName("input");//編輯區所有輸入框
    this.selects = this.editWrap.getElementsByTagName("select");//編輯區所有選擇框
    this.com = document.getElementsByClassName("com");
    this.comInfo = null;//所有組件
    this.pageCOMs = [];//頁面所有元件
    this.rule = null;//編輯區元件可以修改的規則
    this.currentFollow = null;//當前選擇的元素
    this.vdom = new VDomRender();//渲染dom

    this.init();
    this.loadRule();
  }

  /**初始化左側元件 */
  init() {
    let comWrap = document.querySelector("#comWrap");
    let xhr = new XMLHttpRequest();
    xhr.open("get", "./test.json");
    xhr.onload = () => {
      this.comInfo = JSON.parse(xhr.response);
      let str = "";
      if (this.comInfo.length > 0) {
        this.comInfo.forEach((item) => {
          str += `<li class="com" draggable="true" data-id="${item.ID}"><span>${item.Name}</span></li>`;
          //item.HtmlJson = JSON.parse(item.HtmlJson.replace(/(?:\\[rn]|[\r\n]+)+/g, ""));
          //console.log(item);
        });
        comWrap.innerHTML = str;
        this.addEvent();
      }
    };

    xhr.send();
  }

  /**載入元件可以修改的規則 */
  loadRule() {
    let xhr = new XMLHttpRequest();
    xhr.open("get", "./editRule.json");
    xhr.onload = () => {
      this.rule = JSON.parse(xhr.response).rule;
    };

    xhr.send();
  }

  /**元件的事件*/
  addEvent() {
    let menuBTN = (this.com.length > 0) ? SystemMenu(this.com) : [];//右鍵系統管理欄按鈕

    for (let item of this.com) {
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
                //Popup({ url: `/Tools/MoreCOM?ID=${this.dataset.id}` });
              };
              break;

            case "刪除":
              itemBTN.ele.onclick = () => {
                //AlertWindow({ info: "確定刪除?", status: "confirm" }).then(() => {
                //	ajaxData({ id: this.id }, "/Tools/Delete");
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
        let that = this;
        let id = e.dataTransfer.getData('text/plain');
        let currentCOM = this.comInfo.filter(item => item.ID === id);

        e.target.style.background = "";

        if (currentCOM.length > 0) {
          currentCOM = JSON.parse(JSON.stringify(currentCOM[0]));
          currentCOM.ID = this.pageCOMs.length + 1 + "";
          currentCOM.ele = this.vdom.render(currentCOM.HtmlJson, e.target);

          currentCOM.ele.onclick = function (e) {
            e.preventDefault();
            this.style.setProperty("--w", this.offsetWidth + "px");
            this.style.setProperty("--h", this.offsetHeight + "px");
            let htmlJson = that.pageCOMs.filter(item => item.ID === this.dataset.id.split("-")[0])[0];
            that.editArea(htmlJson);

            if (that.currentFollow !== null) {
              that.currentFollow.classList.toggle("follow");
            }
            that.currentFollow = this;
            if (this.className.indexOf("follow") < 0) {
              this.className += " follow";
            }
          };
          that.pageCOMs.push(currentCOM);
        }
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
    let rule = this.rule.filter(item => item.type === data.HtmlJson.ele)[0];
    if (rule === undefined) {
      this.editWrap.innerHTML = "";
      return;
    }
    if (data.HtmlJson.attr === undefined) {
      data.HtmlJson.attr = {};
    }
    if (data.HtmlJson.style === undefined) {
      data.HtmlJson.style = {};
    }
    //編輯區生成
    let attrStr = "", styleStr = "";
    rule.attr.forEach(item => {
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
    rule.style.forEach(item => {
      let styleName = Object.keys(data.HtmlJson.style).find(a => a === Object.keys(item)[1]);
      let val = (styleName) ? data.HtmlJson.style[styleName] : "";
      attrStr += `<div><label>${item.name}：</label><input type="text" name="${Object.keys(item)[1]}" value="${val}" data-type="style"/></div>`;
    });
    this.editWrap.innerHTML = attrStr + styleStr;

    //編輯區
    for (let i = 0; i < this.inputs.length; i++) {
      this.inputs[i].onchange = (e) => {
        if (e.target.dataset.type === "attr") {
          data.ele[e.target.name] = e.target.value;
          data.HtmlJson.attr[e.target.name] = e.target.value;
        } else if (e.target.dataset.type === "style") {
          let styleName = e.target.name.split("-");
          if (styleName.length > 1) {
            styleName = styleName[0] + styleName[1].slice(0, 1).toUpperCase() + styleName[1].slice(1);
          } else {
            styleName = styleName[0];
          }
          data.ele.style[styleName] = e.target.value;
          data.HtmlJson.style[e.target.name] = e.target.value;
        }
      };
    }

    for (let i = 0; i < this.selects.length; i++) {
      this.selects[i].onchange = (e) => {
        data.ele[e.target.name] = e.target.value;
        if (data.HtmlJson.attr === undefined) {
          data.HtmlJson.attr = {};
        }
        data.HtmlJson.attr[e.target.name] = e.target.value;
      };
    }
  }
}

new Drag();