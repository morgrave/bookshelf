import { LocationStrategy, NgPluralCase } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Adventures, NPC, NPCs, Outcome, Outcomes } from '../models/adventure.model';

@Component({
  selector: 'app-helper',
  templateUrl: './helper.component.html',
  styleUrls: ['./helper.component.scss'],
})
export class HelperComponent implements OnInit {
  baseHref = this.locationStrategy.getBaseHref();
  image: string = ``;
  adventure: any = null;
  income: number = 0;
  outcomes: Outcome[] = [];
  npcList = NPCs;

  formGroup = new FormGroup({
    npcs: new FormGroup({ }),
  });

  constructor(
    private locationStrategy: LocationStrategy,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.image = `${this.baseHref}assets/images/paper.png`;
    // http://localhost:4200/helper?adventure=0&income=1000000&outcomes=basicfee,elaydren
    const outcomeArray =
      this.activatedRoute.snapshot.queryParamMap.get('outcomes');
    this.income = +this.activatedRoute.snapshot.queryParamMap.get('income')!;
    this.adventure = Adventures.find(
      (x) =>
        x.id === +this.activatedRoute.snapshot.queryParamMap.get('adventure')!
    );
    if (outcomeArray !== null) {
      const parsed = outcomeArray.split(',');
      this.npcList.forEach(x => {
        (<FormGroup>this.formGroup.controls['npcs']).addControl(x.id, new FormControl(parsed.includes(x.id) ? true : false));
      })
      this.outcomes = Outcomes.filter((x) => parsed.includes(x.id)).map((x) => {
        // 개인별 금액 계산은 여기서 하기 좋아보인다.
        return {
          ...x,
          file: x.file ? `${this.baseHref}assets/images/${x.file}` : ``,
        };
      });
    }
  }

  modifyForm(npc: NPC) {
    (<FormGroup>this.formGroup.controls['npcs']).controls[npc.id].setValue(!(<FormGroup>this.formGroup.controls['npcs']).controls[npc.id].value);
    this.updateForm(npc, (<FormGroup>this.formGroup.controls['npcs']).controls[npc.id].value);
  }

  updateForm(npc: NPC, update: boolean) {
    if (update) {
      const outcome = Outcomes.find(x => x.id === npc.id);
      if (outcome) {
        this.outcomes.push({
          ...outcome,
          file: outcome.file ? `${this.baseHref}assets/images/${outcome.file}` : ``,
        });
        // update router
      }
    }
    else {
      this.outcomes = this.outcomes.filter(x => x.id !== npc.id);
    }
  }

  isSelected(npc: NPC) {
    return (<FormGroup>this.formGroup.controls['npcs']).controls[npc.id].value;
  }

  calculatePlayerReward() {
    
  }
}
