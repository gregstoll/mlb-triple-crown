"use strict"

let TEAM_NAMES_TO_ABBREVS = new Map([
    ["Houston Astros", "HOU"],
    ["Athletics", "ATH"],
    ["Seattle Mariners", "SEA"],
    ["Los Angeles Angels", "LAA"],
    ["Texas Rangers", "TEX"],

    ["New York Yankees", "NYY"],
    ["Baltimore Orioles", "BAL"],
    ["Toronto Blue Jays", "TOR"],
    ["Tampa Bay Rays", "TBR"],
    ["Boston Red Sox", "BOS"],

    ["Chicago White Sox", "CWS"],
    ["Cleveland Guardians", "CLE"],
    ["Detroit Tigers", "DET"],
    ["Kansas City Royals", "KCR"],
    ["Minnesota Twins", "MIN"],

    ["San Francisco Giants", "SF"],
    ["Los Angeles Dodgers", "LAD"],
    ["San Diego Padres", "SD"],
    ["Colorado Rockies", "COL"],
    ["Arizona Diamondbacks", "ARI"],

    ["New York Mets", "NYM"],
    ["Washington Nationals", "WSH"],
    ["Atlanta Braves", "ATL"],
    ["Philadelphia Phillies", "PHI"],
    ["Miami Marlins", "MIA"],

    ["Milwaukee Brewers", "MIL"],
    ["Chicago Cubs", "CHC"],
    ["Cincinnati Reds", "CIN"],
    ["St. Louis Cardinals", "STL"],
    ["Pittsburgh Pirates", "PIT"]
]);

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
        const otherLeaders = this.otherLeaders;
        for (let entry of data) {
            let row = table.insertRow();
            row.innerHTML = `<td>${entry[0]}</td><td>${entry[1]}</td><td>${TEAM_NAMES_TO_ABBREVS.get(entry[2]) ?? entry[2]}</td><td>${entry[3]}</td>`;
            const key = entry[1] + "|" + entry[2];
            if (otherLeaders.has(key)) {
                row.classList.add("otherLeader");
                row.classList.add("otherLeader" + otherLeaders.get(key));
            }
        }
    }
    /**
     * @type string
     */
    get stat() {
        return this.getAttribute('stat');
    }
    /**
     * @type Array<Array<string>>
     */
    get data() {
        return JSON.parse(this.getAttribute('data'));
    }
    /**
     * @type Map<string, number>
     */
    get otherLeaders() {
        return new Map(Object.entries(JSON.parse(this.getAttribute('otherLeaders'))));
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
        const response = await fetch(url + "?" + Math.random());
        const lastModified = response.headers.get("Last-Modified");
        return {lastModified, data: await response.json()};
    }

    updateTable(id, jsonName, data) {
        const jsonNames = ["homeRuns", "runsBattedIn", "battingAverage"];
        let leadersInOthers = new Map();
        for (const otherName of jsonNames) {
            if (jsonName == otherName) {
                continue;
            }
            for (const entry of data[otherName]) {
                const key = entry[1] + "|" + entry[2];
                // getOrInsert() isn't quite supported enough yet
                let oldValue = leadersInOthers.get(key);
                leadersInOthers.set(key, (oldValue ?? 0) + 1);
            }
        }
        this.shadowRoot.getElementById(id).setAttribute("otherLeaders", JSON.stringify(Object.fromEntries(leadersInOthers)));
        this.shadowRoot.getElementById(id).setAttribute("data", JSON.stringify(data[jsonName]));
    }

    connectedCallback() {
        let lastModified = this.shouldShowLastModified ? '<div id="lastUpdatedDiv">Last updated: <span id="lastUpdatedSpan"></span></div>' : "";
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="statsleague.css">
            <h1>${this.leagueName}</h1>
            <league-stats id="hr" stat="Home Runs"></league-stats>
            <league-stats id="rbi" stat="RBI"></league-stats>
            <league-stats id="avg" stat="Batting Average"></league-stats>${lastModified}`;
        this.getData(this.leagueId).then(response => {
            const data = response.data;
            this.updateTable("hr", "homeRuns", data);
            this.updateTable("rbi", "runsBattedIn", data);
            this.updateTable("avg", "battingAverage", data);
            if (this.shouldShowLastModified) {
                this.shadowRoot.getElementById("lastUpdatedSpan").innerText = (new Date(response.lastModified)).toLocaleString();
            }
        });

    }
    get leagueId() {
        return this.getAttribute('leagueId');
    }
    get leagueName() {
        return this.getAttribute('leagueName');
    }
    get shouldShowLastModified() {
        return !!this.getAttribute('lastModified');
    }
}

customElements.define('league-element', League);

