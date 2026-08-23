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
        const leaders = this.leaders;
        for (let entry of data) {
            let row = table.insertRow();
            row.innerHTML = `<td>${entry[0]}</td><td>${entry[1]}</td><td>${TEAM_NAMES_TO_ABBREVS.get(entry[2]) ?? entry[2]}</td><td>${entry[3]}</td>`;
            const key = entry[1] + "|" + entry[2];
            if (leaders.get(key).length > 1) {
                row.classList.add("otherLeader");
                row.classList.add("otherLeader" + (leaders.get(key).length - 1));
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
    get leaders() {
        return new Map(Object.entries(JSON.parse(this.getAttribute('leaders'))));
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

    calculateLeaders(data) {
        let leaders = new Map();
        const jsonNames = ["homeRuns", "runsBattedIn", "battingAverage"];
        for (const name of jsonNames) {
            for (const entry of data[name]) {
                const key = entry[1] + "|" + entry[2];
                // getOrInsert() isn't quite supported enough yet
                let oldValue = leaders.get(key);
                leaders.set(key, (oldValue ?? []).concat([entry[0]]));
            }
        }
        return leaders;
    }

    updateTable(id, jsonName, data, leaders) {
        const jsonNames = ["homeRuns", "runsBattedIn", "battingAverage"];
        this.shadowRoot.getElementById(id).setAttribute("leaders", JSON.stringify(Object.fromEntries(leaders)));
        this.shadowRoot.getElementById(id).setAttribute("data", JSON.stringify(data[jsonName]));
    }

    connectedCallback() {
        let lastModified = this.shouldShowLastModified ? '<div id="lastUpdatedDiv">Last updated: <span id="lastUpdatedSpan"></span></div>' : "";
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="statsleague.css">
            <h1>${this.leagueName}</h1>
            <p><span id="gamesLeftParent">~<span id="gamesLeft"></span></span> games left in the season</p>
            <p id="leader" style="display: none;"><span id="leaderInner"><span id="leaderName"></span> is in the lead for the Triple Crown!</span></p>
            <league-stats id="hr" stat="Home Runs"></league-stats>
            <league-stats id="rbi" stat="RBI"></league-stats>
            <league-stats id="avg" stat="Batting Average"></league-stats>${lastModified}`;
        this.getData(this.leagueId).then(response => {
            const data = response.data;
            const leaders = this.calculateLeaders(data);
            this.updateTable("hr", "homeRuns", data, leaders);
            this.updateTable("rbi", "runsBattedIn", data, leaders);
            this.updateTable("avg", "battingAverage", data, leaders);
            if (this.shouldShowLastModified) {
                this.shadowRoot.getElementById("lastUpdatedSpan").innerText = (new Date(response.lastModified)).toLocaleString();
            }
            let tripleCrownLeaders = [];
            for (let leader of leaders.entries()) {
                // If players are tied for first, we'll count them
                if (leader[1].length === 3 && leader[1].every(val => val === 1)) {
                    tripleCrownLeaders.push(leader[0].substring(0, leader[0].indexOf('|')));
                }
            }
            if (tripleCrownLeaders.length) {
                this.shadowRoot.getElementById("leaderName").innerText = tripleCrownLeaders.join(" and ");
                this.shadowRoot.getElementById("leader").style.display = "block";
            } else {
                this.shadowRoot.getElementById("leader").style.display = "none";
            }
            if (!data.gamesLeft) {
                this.shadowRoot.getElementById("gamesLeftParent").innerText = "No";
            } else {
                this.shadowRoot.getElementById("gamesLeft").innerText = data.gamesLeft;
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

