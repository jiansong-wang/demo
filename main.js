class Drag {
  constructor() {
    this.container = null;//內容區
    this.editWrap = document.querySelector("#editWrap");//編輯區
    this.layerWrap = document.querySelector("#layer");//階層區
    this.inputs = this.editWrap.getElementsByTagName("input");//編輯區所有輸入框
    this.selects = this.editWrap.getElementsByTagName("select");//編輯區所有選擇框
    this.com = document.getElementsByClassName("com");//所有元件
    this.comInfo = null;//所有組件
    this.pageCOMs = [];//頁面所有元件
    this.rule = null;//編輯區元件可以修改的規則
    this.currentFollow = null;//當前選擇的元素
    this.vdom = new VDomRender();//渲染dom

    this.init();
  }

  /**初始化 */
  init() {
    const iframe = document.querySelector("iframe");
    iframe.srcdoc = '<html><head><style>.follow {position:relative;}.follow:before {content:"";position:absolute;top:0;left: 0;right:0;bottom:0;box-shadow: 0 0 0 2px red;pointer-events: none;}</style></head><body><div id="container" style="min-height:100vh"></div></body></html>';
    iframe.onload = () => {
      this.container = iframe.contentDocument.querySelector("#container");
      this.addEvent(2);
    }

    //載入元件區
    this.loadComponent();

    //載入元件可以修改的規則
    this.loadAjaxData("get", "./editRule.json", (data) => {
      this.rule = JSON.parse(data).rule;
    });
  }

  //載入元件區
  loadComponent() {
    const head = document.querySelector("head");
    const style = document.createElement("style");

    this.loadAjaxData("get", "./test.json", (data) => {
      this.comInfo = JSON.parse(data);
      let str = "";
      if (this.comInfo.length > 0) {
        this.comInfo.forEach((item) => {
          str += `<li class="com" draggable="true" data-id="${item.ID}"><span>${item.Name}</span></li>`;
          item.HtmlJson = this.vdom.toVDom(document.createRange().createContextualFragment(item.Html).firstChild);
          if (item.Css) {
            style.innerText = item.Css;
            head.appendChild(style);
            item.HtmlJson.props.pseudo = this.vdom.pseudoToObject(document.styleSheets[document.styleSheets.length - 1].cssRules);
            style.remove();
          }
        });
        document.querySelector("#comWrap").innerHTML = str;
        this.addEvent(1);
      }
    });
  }

  /**
   * ajax
   * @param {string} type 類型
   * @param {string} url 地址
   * @param {Function} fn load後要執行的方法
   * @param {{}} data 要傳送的參數
   */
  loadAjaxData(type, url, fn, data = null) {
    const xhr = new XMLHttpRequest();
    xhr.open(type, url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => { fn(xhr.response) };
    xhr.send(data);
  }

  /**
   * 事件(暫定這麼寫)
   * @param {number} type 1是元件區、2是內容區
   */
  addEvent(type) {
    if (type === 1) {
      //const that = this;
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
        //item.removeEventListener("contextmenu");
        item.addEventListener("contextmenu", function () {
          menuBTN.forEach(itemBTN => {
            switch (itemBTN.name) {
              case "編輯":
                itemBTN.ele.onclick = () => {
                  //Popup({ url: `/Tools/MoreCOM2?ID=${item.dataset.id}` });
                };
                break;

              case "刪除":
                itemBTN.ele.onclick = () => {
                  //AlertWindow({ info: "確定刪除?", status: "confirm" }).then(() => {
                  //	const xhr = new XMLHttpRequest();
                  //	xhr.open("post", "/Tools/Delete");
                  //	xhr.setRequestHeader("Content-Type", "application/json");
                  //	xhr.onload = () => {
                  //		if (JSON.parse(xhr.response).status > 0) {
                  //			AlertWindow({ info: "刪除成功", status: "ok" });
                  //			//that.loadComponent();
                  //		} else {
                  //			AlertWindow({ info: "刪除失敗", status: "err" });
                  //		}
                  //	};
                  //	xhr.send(JSON.stringify({ id: this.dataset.id }));
                  //});
                };
                break;
            }
          });
        });
      }
    } else if (type === 2) {
      this.container.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.target.dataset.drop === "true" || e.target === this.container) {
          const that = this;
          const id = e.dataTransfer.getData('text/plain');
          let currentCOM = this.comInfo.filter(item => item.ID === id);

          e.target.style.background = "";

          if (currentCOM.length > 0) {
            currentCOM = JSON.parse(JSON.stringify(currentCOM[0]));
            currentCOM.ID = e.target.dataset.id ? e.target.dataset.id + "-" + (e.target.children.length + 1) : e.target.children.length + 1 + "";
            currentCOM.ele = this.vdom.render(currentCOM.HtmlJson, e.target);

            //階層區
            const layerli = document.createElement("li");
            layerli.dataset.id = currentCOM.ID;
            layerli.innerText = currentCOM.Name;
            layerli.onclick = function () {
              const htmlJson = that.searchEleJson(this.dataset.id);
              that.editArea(htmlJson);

              that.focus(htmlJson.ele);
            };
            this.layerWrap.appendChild(layerli);

            currentCOM.ele.onclick = function (e) {
              e.preventDefault();
              e.stopPropagation();
              //console.log(this)

              const htmlJson = that.searchEleJson(this.dataset.id);
              that.editArea(htmlJson);

              that.focus(this);
              return false;
            };

            this.pushChildren(currentCOM);
            //console.log(this.pageCOMs)
          }
        }
      };

      this.container.ondragenter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.dataset.drop === "true" || e.target === this.container) {
          e.target.style.background = "#eee";
        }

        if (this.currentFollow !== null) {
          this.currentFollow.classList.toggle("follow");
          this.currentFollow = null;
          this.editWrap.innerHTML = "";
        }
      };

      this.container.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.dataset.drop === "true" || e.target === this.container) {
          e.target.style.background = "";
        }
      };

      this.container.ondragover = function (e) {
        e.preventDefault();
        e.stopPropagation();
      };
    }
  }

  /**
   * 放入到頁面所有元件或父元素的htmljson裡
   * @param {{}} currentCOM 當前的元件
   */
  pushChildren(currentCOM) {
    let parent = null, level = currentCOM.ID.split("-");

    if (level.length > 1) {
      parent = this.pageCOMs[level[0] - 1];
      level.shift();
      while (level.length > 1) {
        parent = parent.HtmlJson.children[level[0] - 1];
        level.shift();
      }

      parent.HtmlJson.children.push(currentCOM);
    } else {
      this.pageCOMs.push(currentCOM);
    }
    //console.log(this.pageCOMs)
  }

  /**
   * 搜尋元素的JSON
   * @param {string} id 元素的ID
   */
  searchEleJson(id) {
    let node, list = [...this.pageCOMs], val;
    while ((node = list.shift())) {
      if (val !== undefined) {
        return val;
      } else if (typeof node === "object" && val === undefined) {
        //console.log(node)
        val = (function (node) {
          if (node.ID === id) {
            return node;
          } else {
            if (node.HtmlJson) {
              node.HtmlJson.children && list.push(...node.HtmlJson.children);
            }
          }
        })(node);
      }
    }
    return val;
  }

  /**
   * 關注元素外圍會有框框
   * @param {Element} who 被關注的元素
   */
  focus(who) {
    if (this.currentFollow !== null) {
      this.currentFollow.classList.toggle("follow");
    }

    this.currentFollow = who;

    if (who.className.indexOf("follow") < 0) {
      who.className += " follow";
    }
  }

  /**
  * 屬性編輯區
  * @param {{}} data 元素的JSON資料
  */
  editArea(data) {
    let rule = this.rule.filter(item => item.type === data.RuleType)[0];
    if (rule === undefined) {
      this.editWrap.innerHTML = "";
      return;
    }
    if (!("attr" in data.HtmlJson.props)) {
      data.HtmlJson.props.attr = {};
    }
    if (!("style" in data.HtmlJson.props)) {
      data.HtmlJson.props.style = {};
    }
    //編輯區生成
    let attrStr = "", styleStr = "", otherStr = "";
    rule.attr.forEach(item => {
      let attrName = Object.keys(data.HtmlJson.props.attr).find(a => a === Object.keys(item)[1]);
      let val = (attrName) ? data.HtmlJson.props.attr[attrName] : "";

      attrStr += `<div><label>${item.name}：</label>`;
      if (Array.isArray(item[Object.keys(item)[1]])) {
        attrStr += `<select name="${Object.keys(item)[1]}">`;
        item[Object.keys(item)[1]].forEach(v => {
          attrStr += `<option value="${v}" ${(v === val) ? "selected" : ""}>${v}</option>`;
        });
        attrStr += "</select></div>";
      } else {
        attrStr += `<input type="text" name="${Object.keys(item)[1]}" value="${val}" data-type="attr"/></div>`;
      }
    });

    rule.style.forEach(item => {
      let styleName = Object.keys(data.HtmlJson.props.style).find(a => a === Object.keys(item)[1]);
      let val = (styleName) ? data.HtmlJson.props.style[styleName] : "";
      attrStr += `<div><label>${item.name}：</label><input type="text" name="${Object.keys(item)[1]}" value="${val}" data-type="style"/></div>`;
    });

    if (rule.isDrop !== undefined) {
      otherStr += `<div><label>是否可以嵌套：</label><input type="checkbox" ${(data.ele.dataset.drop === "true" ? "checked" : "")} data-type="drop"/>`;
    }

    this.editWrap.innerHTML = attrStr + styleStr + otherStr;

    //編輯區
    for (let i = 0; i < this.inputs.length; i++) {
      this.inputs[i].onchange = (e) => {
        if (e.target.dataset.type === "attr") {
          if (e.target.value !== "") {
            data.ele[e.target.name] = e.target.value;
            data.HtmlJson.props.attr[e.target.name] = e.target.value;
          } else {
            data.ele.removeAttribute(e.target.name);
            delete data.HtmlJson.props.attr[e.target.name];
          }
        } else if (e.target.dataset.type === "style") {
          let styleName = e.target.name.split("-");

          if (styleName.length > 1) {
            styleName = styleName[0] + styleName[1].slice(0, 1).toUpperCase() + styleName[1].slice(1);
          } else {
            styleName = styleName[0];
          }

          data.ele.style[styleName] = e.target.value;
          data.HtmlJson.props.style[e.target.name] = e.target.value;

          if (e.target.name === "width") {
            data.ele.style.setProperty("--w", e.target.value);
          }

          if (e.target.name === "height") {
            data.ele.style.setProperty("--h", e.target.value);
          }
        } else if (e.target.dataset.type === "drop") {
          data.ele.dataset.drop = e.target.checked;
        }
      };
    }

    for (let i = 0; i < this.selects.length; i++) {
      this.selects[i].onchange = (e) => {
        data.ele[e.target.name] = e.target.value;
        data.HtmlJson.props.attr[e.target.name] = e.target.value;
      };
    }
  }
}

new Drag();