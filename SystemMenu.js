//右鍵系統管理欄選單
; (function () {
  "use strick";
  var SystemMenu = function (eles) {
    if (Array.isArray(eles) || eles.length === 0) return;
    var menu = document.createElement("div");//右鍵選單
    var menuBTN = [];

    menu.id = "systemMenu";
    menu.setAttribute("style", "position:fixed;width:180px;padding:0.25em;background-color:#fff;border:1px solid #bebebe;border-radius:0.2em;box-shadow:0 2px 5px rgb(0 0 0/50%);")
    menu.innerHTML = "<style>#systemMenu li{padding:5px;list-style:none;cursor:pointer;}#systemMenu li:hover{background-color:#eee;}</style><ul style='padding:0;margin:0;'><li data-typeBTN='edit'>編輯</li><li data-typeBTN='delete'>刪除</li></ul>";

    var menuOption = menu.querySelectorAll("li");
    menuBTN = Object.keys(menuOption).map(function (key) {
      return {
        type: menuOption[key].dataset.typebtn,
        ele: menuOption[key],
      }
    });

    for (var i = 0; i < eles.length; i++) {
      eles[i].onclick = function (e) {
        e.stopPropagation();
      }

      eles[i].oncontextmenu = function (e) {
        document.body.appendChild(menu);
        menu.style.top = e.clientY + "px";
        menu.style.left = e.clientX + "px";
        return false;
      };
    }

    document.onclick = function () {
      var systemMenu = document.querySelector("#systemMenu");
      if (systemMenu !== null) {
        systemMenu.parentNode.removeChild(systemMenu);
      }
    };

    return menuBTN;
  };

  window.SystemMenu = SystemMenu;
})();