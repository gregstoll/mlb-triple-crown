from __future__ import annotations, division
import datetime
import json
import os
import time
import sys
from pathlib import Path

import statsapi

def get_leader_data(league: str, leaderCategory: str, quiet: bool) -> list:
    leagueId = None
    if league == 'AL': 
        leagueId = 103
    elif league == 'NL':
        leagueId = 104
    if not quiet:
        print(f"getting for league_id={leagueId}, leaderCategory={leaderCategory}")
    # throttle
    time.sleep(0.3)
    leaders : list = statsapi.league_leader_data(leaderCategories=leaderCategory, leagueId=leagueId, gameTypes='R', statGroup='hitting', statType='season', limit=5)
    return leaders

class LeagueLeaders:
    def __init__(self, leagueName: str, quiet: bool):
        self.leagueName = leagueName
        self.quiet = quiet
        self.leaders = {'homeRuns': [], 'battingAverage': [], 'runsBattedIn': []}

    def update(self):
        for cat in ['homeRuns', 'battingAverage', 'runsBattedIn']:
            leaders : list = get_leader_data(self.leagueName, cat, quiet=True)
            self.leaders[cat] = leaders

    def get_json_file_path(self) -> Path:
        data_path = Path(os.path.realpath(__file__)).parent / "data"
        return data_path / f"{self.leagueName}.json"

    def write_to_json(self):
        file_path = self.get_json_file_path()
        os.makedirs(file_path.parent, exist_ok=True)
        with open(file_path, 'w') as f:
            f.write(json.dumps(self.leaders))

if __name__ == '__main__':
    import pprint
    pp = pprint.PrettyPrinter(indent=2)
    #meta : list = statsapi.meta('leagueLeaderTypes')
    #pp.pprint(meta)

    for league in ['AL', 'NL', 'MLB']:
        ll = LeagueLeaders(leagueName=league, quiet=True)
        ll.update()
        ll.write_to_json()
        #pp.pprint(ll.leaders)
