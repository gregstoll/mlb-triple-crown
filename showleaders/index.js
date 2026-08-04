"use strict"

class LeagueStats extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    static get observedAttributes() {
        return ['data'];
    }
    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.update();
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="statstable.css">
            <table><tr><th colspan="4">${this.stat}</th></tr></table>`;
    }
    update() {
        let table = this.shadowRoot.querySelector("table");
        let rows = table.querySelectorAll("tr");
        for (let row of Array.from(rows).slice(1)) {
            row.remove();
        }
        const data = this.data;
        const otherLeaders = new Set(this.otherLeaders);
        for (let entry of data) {
            let row = table.insertRow();
            row.innerHTML = `<td>${entry[0]}</td><td>${entry[1]}</td><td>${entry[2]}</td><td>${entry[3]}</td>`;
            if (otherLeaders.has(entry[1] + "|" + entry[2])) {
                row.classList.add("otherLeader");
            }
        }
    }
    get stat() {
        return this.getAttribute('stat');
    }
    get data() {
        return JSON.parse(this.getAttribute('data'));
    }
    get otherLeaders() {
        return JSON.parse(this.getAttribute('otherLeaders'));
    }

}
customElements.define('league-stats', LeagueStats);

class League extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async getData(leagueName) {
        const url = `data/${leagueName}.json`;
        const response = await fetch(url);
        return await response.json();
    }

    updateTable(id, jsonName, data) {
        const jsonNames = ["homeRuns", "runsBattedIn", "battingAverage"];
        let leadersInOthers = new Set();
        for (const otherName of jsonNames) {
            if (jsonName == otherName) {
                continue;
            }
            for (const entry of data[otherName]) {
                leadersInOthers.add(entry[1] + "|" + entry[2]);
            }
        }
        this.shadowRoot.getElementById(id).setAttribute("otherLeaders", JSON.stringify(Array.from(leadersInOthers)));
        this.shadowRoot.getElementById(id).setAttribute("data", JSON.stringify(data[jsonName]));
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `<h1>${this.leagueName}</h1>
            <league-stats id="hr" stat="Home Runs"></league-stats>
            <league-stats id="rbi" stat="RBI"></league-stats>
            <league-stats id="avg" stat="Batting Average"></league-stats>`;
        this.getData(this.leagueId).then(data => {
            this.updateTable("hr", "homeRuns", data);
            this.updateTable("rbi", "runsBattedIn", data);
            this.updateTable("avg", "battingAverage", data);
        });

    }
    get leagueId() {
        return this.getAttribute('leagueId');
    }
    get leagueName() {
        return this.getAttribute('leagueName');
    }
 
}

customElements.define('league-element', League);

