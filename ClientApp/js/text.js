import BaseComponent from "./BaseComponent.js";
import Ajax from "./component/ajax.js";
import eventBus from "./component/eventBus.js";
class Text extends BaseComponent {
    constructor(id, model) {
        super(id);
        this.saveBTN = this.iframe.querySelector("#saveBTN");
        this.closeBTN = this.iframe.querySelector("#closeBTN");
        this.contentEle = this.iframe.querySelector("textarea[name=content]");
        this.originContent;

        this.init();
    }

    init() {
        this.originContent = this.contentEle.value;

        this.setEvent(this.saveBTN, "click", () => {
            try {
                const form = this.iframe.querySelector("form");
                Ajax.conn({
                    type: "post", url: "/api/File/SaveText", data: new FormData(form)
                }).catch(error => {
                    eventBus.emit("error", error.message);
                });
            } catch (error) {
                eventBus.emit("error", error.message);
            }
        });

        this.setEvent(this.closeBTN, "click", () => {
            this.iframe.querySelector("#closeWindow").click();
        });

        this.setEvent(this.contentEle, "change", (e) => {
            if (this.originContent == e.target.value) {
                return;
            }


        });

    }


}

export default Text;