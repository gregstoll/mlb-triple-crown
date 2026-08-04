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
        this.shadowRoot.innerHTML = `<table><tr><th colspan="4">${this.stat}</th></tr></table>`;
    }
    update() {
        let table = this.shadowRoot.querySelector("table");
        let rows = table.querySelectorAll("tr");
        for (let row of Array.from(rows).slice(1)) {
            row.remove();
        }
        const data = this.data;
        for (let entry of data) {
            let row = table.insertRow();
            row.innerHTML = `<td>${entry[0]}</td><td>${entry[1]}</td><td>${entry[2]}</td><td>${entry[3]}</td>`;
            //let td = row.insertCell();
            //td.innerHTML = '' + entry[0];
        }
    }
    get stat() {
        return this.getAttribute('stat');
    }
    get data() {
        return JSON.parse(this.getAttribute('data'));
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

    connectedCallback() {
        this.shadowRoot.innerHTML = `<h1>${this.leagueName}</h1><league-stats id="hr" stat="Home Runs"></league-stats><league-stats id="rbi" stat="RBI"></league-stats><league-stats id="avg" stat="Batting Average"></league-stats>`;
        this.getData(this.leagueId).then(data => {
            this.shadowRoot.getElementById("hr").setAttribute("data", JSON.stringify(data.homeRuns));
            this.shadowRoot.getElementById("rbi").setAttribute("data", JSON.stringify(data.runsBattedIn));
            this.shadowRoot.getElementById("avg").setAttribute("data", JSON.stringify(data.battingAverage));

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

