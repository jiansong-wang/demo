import vdom from "./VDomRender.js";

class WebEdit {
  constructor() {
    this.container = null;//內容區
    this.layerWrap = document.querySelector("#layer");//階層區
    this.com = new Component();//元件區
    this.editArea = new EditArea();//編輯區
    this.pageCOMs = [];//頁面所有元件
    this.currentFollow = null;//當前選擇的元素

    this.init();
  }

  /**初始化 */
  init() {
    const iframe = document.querySelector("iframe");
    iframe.srcdoc = '<html><head><style>.follow {outline: 2px dashed red !important;}</style></head><body><div id="container" style="min-height:100vh"></div></body></html>';
    iframe.onload = () => {
      this.container = iframe.contentDocument.querySelector("#container");
      this.addEvent(2);
    }

    //載入元件區
    this.com.load().then(() => this.addEvent(1));
  }

  /**
   * 事件(暫定這麼寫)
   * @param {number} type 1是元件區、2是內容區
   */
  addEvent(type, ele = this.com.ele) {
    if (type === 1) {
      const that = this;
      let menuBTN = (ele.length > 0) ? SystemMenu(ele) : [];//右鍵系統管理欄按鈕

      for (let item of ele) {
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
            switch (itemBTN.type) {
              case "edit":
                itemBTN.ele.onclick = () => {
                  //Popup({ url: `/WebEdit/MoreCOM?ID=${this.dataset.id}` });
                };
                break;

              case "delete":
                itemBTN.ele.onclick = () => {
                  //AlertWindow({ info: "確定刪除?", status: "confirm" }).then(() => that.com.delete(this));
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
          const id = e.dataTransfer.getData('text/plain');
          let currentCOM = this.com.data.filter(item => item.ID === id);

          e.target.style.background = "";

          if (currentCOM.length > 0) {
            currentCOM = JSON.parse(JSON.stringify(currentCOM[0]));
            currentCOM.ID = e.target.dataset.id ? e.target.dataset.id + "-" + (e.target.children.length + 1) : e.target.children.length + 1 + "";
            currentCOM.ele = this.com.vdom.render(currentCOM.HtmlJson, e.target);
            if (currentCOM.HtmlJson.ele === "input") {
              const div = document.createElement("div");
              const p = currentCOM.ele.parentNode;

              div.style.display = "inline";
              div.dataset.id = currentCOM.ele.dataset.id;
              div.append(currentCOM.ele);
              p.appendChild(div);
            }

            //階層區
            const layerli = document.createElement("li");
            layerli.dataset.id = currentCOM.ID;
            layerli.innerText = currentCOM.Name;
            layerli.onclick = (e) => {
              const htmlJson = this.searchEleJson(e.target.dataset.id);
              this.editArea.load(htmlJson);

              this.focus(htmlJson.ele);
            };
            this.layerWrap.appendChild(layerli);

            currentCOM.ele.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();

              const htmlJson = this.searchEleJson(e.target.dataset.id);
              this.editArea.load(htmlJson);

              this.focus(e.target);
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
          this.editArea.clear();
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
    console.log(this.pageCOMs)
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
    if (who.nodeName.toLowerCase() === "input") {
      who = who.parentNode;
    }
    if (this.currentFollow !== null) {
      this.currentFollow.classList.toggle("follow");
    }

    this.currentFollow = who;

    if (who.className.indexOf("follow") < 0) {
      who.className += " follow";
    }
  }

}

//元件
class Component {
  constructor() {
    this.ele = document.getElementsByClassName("com");//所有元件元素
    this.data = null;//所有元件資訊
    this.vdom = new vdom();//渲染dom
  }

  /**載入元件區 */
  load() {
    return new Promise((res) => {
      const head = document.querySelector("head");
      const style = document.createElement("style");

      Ajax.conn({
        type: "get",
        url: "./test.json",
        fn: (result) => {
          this.data = JSON.parse(result);
          let str = "";

          if (this.data.length > 0) {
            this.data.forEach((item) => {
              str += `<li class="com" draggable="true" data-id="${item.ID}"><span>${item.Name}</span></li>`;
              item.HtmlJson = this.vdom.toVDom(document.createRange().createContextualFragment(item.Html).firstChild);
              if (item.Css) {
                style.innerText = item.Css;
                head.appendChild(style);
                item.HtmlJson.props.pseudo = this.vdom.pseudoToObject(document.styleSheets[document.styleSheets.length - 1].cssRules);
                style.remove();
              }
            });
          }

          document.querySelector("#comWrap").innerHTML = str;
          res();
        }
      });
    });
  }

  /**更新元件區 */
  update() {
    return new Promise((res) => {
      const head = document.querySelector("head");
      const style = document.createElement("style");

      Ajax.conn({
        type: "get",
        url: "./test.json",
        fn: (result) => {
          let data = JSON.parse(result);
          let str = "";

          if (data.length > 0) {
            data = data.filter(item => this.data.indexOf(item.ID) === -1);

            data.forEach((item) => {
              str += `<li class="com" draggable="true" data-id="${item.ID}">${item.Name}</li>`;
              item.HtmlJson = this.vdom.toVDom(document.createRange().createContextualFragment(item.Html).firstChild);
              if (item.Css) {
                style.innerText = item.Css;
                head.appendChild(style);
                item.HtmlJson.props.pseudo = this.vdom.pseudoToObject(document.styleSheets[document.styleSheets.length - 1].cssRules);
                style.remove();
              }

              this.data.push(item);
            });
          }

          document.querySelector("#comWrap").innerHTML += str;
          res(data);
        }
      });
    });
  }

  /**
   * 元件區刪除元素
   * @param {Element} ele 要刪除的元素
   */
  delete(ele) {
    Ajax.conn({
      type: "post",
      url: "/WebEdit/Delete",
      data: { id: ele.dataset.id },
      fn: (result) => {
        if (JSON.parse(result).status > 0) {
          this.data.forEach((item, i) => {
            if (item.ID === ele.dataset.id) {
              this.data.splice(i, 0);
              ele.remove();
              return;
            }
          });
          AlertWindow({ info: "刪除成功", status: "ok" });
        } else {
          AlertWindow({ info: "刪除失敗", status: "err" });
        }
      }
    });
  }
}

class EditArea {
  constructor() {
    this.editWrap = document.querySelector("#editWrap");//編輯區
    this.inputs = this.editWrap.getElementsByTagName("input");//編輯區所有輸入框
    this.selects = this.editWrap.getElementsByTagName("select");//編輯區所有選擇框
    this.rule = null;//編輯區元件可以修改的規則

    this.init();
  }

  init() {
    //載入元件可以修改的規則
    Ajax.conn({
      type: "get",
      url: "./editRule.json",
      fn: (result) => {
        this.rule = JSON.parse(result).rule;
      }
    });
  }

  /**
  * 屬性編輯區
  * @param {{}} data 元素的JSON資料
  */
  load(data) {
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

          //if (e.target.name === "width") {
          //	data.ele.style.setProperty("--w", e.target.value);
          //}

          //if (e.target.name === "height") {
          //	data.ele.style.setProperty("--h", e.target.value);
          //}
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

  /**清空編輯面板 */
  clear() {
    this.editWrap.innerHTML = "";
  }
}

//ajax連線
class Ajax {
  static conn(set) {
    let { type, url, data, fn } = set;
    if (typeof fn !== "function") {
      fn = () => { };
    }

    if (typeof data !== "object") {
      data = {};
    }

    let xhr = null;
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
      xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhr.open(type, url);
    xhr.setRequestHeader("Content-Type", (type === "get") ? "application/x-www-form-urlencoded; charset=utf-8;" : "application/json");
    xhr.onload = () => { fn(xhr.response) };
    xhr.send((type === "get") ? null : JSON.stringify(data));
  }
}

new WebEdit();