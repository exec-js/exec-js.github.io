{
    const version = "0.12.0";
    const runtime = "@antonz/codapi";
    const src = (type) => `https://unpkg.com/${runtime}@${version}/dist/snippet.` + type;

    const codapiSnippet = "exec-snippet"; // overload codapi-snippet Web Component

    // generic createElement function
    const createElement = (tag, props = {}) => Object.assign(document.createElement(tag), props);
    // if codapi-snippet is already defined, init this <exec-js> Web Component
    customElements.define("exec-js", class extends HTMLElement {
        get codapi_snippet() {
            return this.shadowRoot.querySelector(codapiSnippet);
        }
        get code() {
            return this.shadowRoot.querySelector("#code");
        }
        set code(str) {
            this.code.innerHTML = str;
        }
        get codapi_toolbar() {
            return this.codapi_snippet.querySelector("codapi-toolbar");
        }
        get codapi_status() {
            return this.codapi_snippet.querySelector("codapi-status");
        }
        get codapi_output() {
            return this.codapi_snippet.querySelector("codapi-output");
        }
        constructor() {
            super()
                .attachShadow({ mode: "open" });
            customElements
                .whenDefined("codapi-snippet")
                .then(() => {
                    console.warn("codapi-snippet defined");
                    customElements.define(codapiSnippet, class extends customElements.get("codapi-snippet") {
                        constructor() {
                            super();
                            console.warn(codapiSnippet + " constructor");
                        }
                        connectedCallback() {
                            this.addEventListener("load", () => {
                                console.error("codapi-snippet load event");
                            });
                            // super.connectedCallback();
                            // console.warn(codapiSnippet + " connectedCallback");
                            // this.addEventListener("execute", () => {
                            //     console.warn(codapiSnippet + " execute listener");
                            // });

                            if (this.ready) return;
                            const timeout = parseInt(this.getAttribute("init-delay"), 10) || 0;
                            setTimeout(() => {
                                this.init();
                                this.render();
                                this.listen();
                                console.log(666, this.code);
                                this.ready = true;
                                this.dispatchEvent(new Event("load"));
                            }, timeout);


                        }
                    });

                });
        }
        execute() {
            console.warn("execute");
            this.codapi_snippet.execute();
        }
        _initExecComponent() {
            console.warn("initExecComponent", this.codapi_snippet);
            setTimeout(() => {
                if (this.hasAttribute("autorun")) this.execute();
                if (this.hasAttribute("autoupdate")) {
                    console.warn("attach autoupdate", this.code.innerHTML);
                }
            }, 10);
        }
        connectedCallback() {
            setTimeout(() => { // make sure ligthDOM is parsed
                const NO_GUI = this.hasAttribute("noui");
                const NO_TOOLBAR = this.hasAttribute("notoolbar");
                const NO_STATUS = this.hasAttribute("nostatus");
                const NO_OUTPUT = this.hasAttribute("nooutput");
                const NO_CLOSE = this.hasAttribute("noclose");
                const NO_EDIT = this.hasAttribute("noedit");
                const NO_RUN = this.hasAttribute("norun");
                this.shadowRoot.append(
                    createElement("style", {
                        innerHTML:
                            (NO_GUI || NO_TOOLBAR ? "codapi-toolbar{display:none}" : "") +
                            (NO_GUI || NO_TOOLBAR ? "codapi-toolbar button{display:none}" : "") +
                            (NO_GUI || NO_STATUS ? "codapi-status{display:none}" : "") +
                            (NO_GUI || NO_CLOSE ? "codapi-output [href='#close']{display:none}" : "") +
                            (NO_GUI || NO_EDIT ? "codapi-toolbar [href='#edit']{display:none}" : "") +
                            "codapi-output {position:relative;display:block;background:lightgreen}"
                    }),
                    createElement("div", {
                        id: "snippet",
                        //! Must be injected as HTML to be parsed by codapi-snippet
                        innerHTML: `<pre id="code">` + indentJSCode(this.innerHTML) + `</pre>` +
                            //! codapi-snippet> can't be create with createElement
                            `<${codapiSnippet} engine="browser" sandbox="javascript" editor="basic"></${codapiSnippet}>`
                    }),
                );
                setTimeout(() => {
                    this.code.setAttribute("contenteditable", false);
                }, 100);

            }, 0);
            this._ensureAPI();
        }
        _ensureAPI() {
            const initExecComponent = () => {
                this.code = "console.log(21)";
                this._initExecComponent();
            }
            if (document.querySelector(`[src^="${runtime}"]`)) {
                // if blog-cell is already loaded init this <exec-js> Web Component
                // after 1 millisecond so <exec-js> innerHTML is parsed
                setTimeout(initExecComponent, 1);
            } else {
                // if exec code API not loaded yet, load CSS and JS files and init this <exec-js></exec-js> Web Component
                document.body.append(
                    createElement("link", {
                        rel: "stylesheet",
                        href: src("css")
                    }),
                    createElement("script", {
                        src: src("js"),
                        onload: initExecComponent
                    })
                )
            }

        }//_ensureAPI
    })//exec-js

    function indentJSCode(jsCode, indentSize = 4) {
        let lines = jsCode.split('\n');
        let indentLevel = 0;
        let indentString = ' '.repeat(indentSize);
        return lines.map(line => {
            if (line.includes('}')
                //|| line.includes(']')
            ) indentLevel--;
            if (indentLevel < 0) indentLevel = 0;
            let indentedLine = indentString.repeat(indentLevel) + line.trim();
            if (line.includes('{')
                //|| line.includes('[')
            ) indentLevel++;
            return indentedLine;
        }).join('\n');
    }


}// scope