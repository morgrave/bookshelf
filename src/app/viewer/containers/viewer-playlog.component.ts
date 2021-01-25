import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { Campaigns } from 'src/app/shared/models/campaigns.model';
import { ViewerService } from '../viewer.service';

@Component({
  selector: 'app-viewer-playlog',
  templateUrl: './viewer-playlog.component.html',
  styleUrls: ['./viewer-playlog.component.scss']
})
export class ViewerPlaylogComponent implements OnInit {
  curPos = 0;

  constructor(
    private route: ActivatedRoute,
    public viewerService: ViewerService,
  ) { }

  async ngOnInit() {
    this.route.params
      .pipe(take(1))
      .subscribe(async (params) => {
        if (params['title']) {
          const campaign = Campaigns.find(x => x.title === params['title']);
          const log = params['index'] ? campaign?.logs.find(x => x.index === params['index']) : campaign?.logs[0];
          if (campaign && log) {
            await this.viewerService.loadHtml(campaign, log);
          }
        }
        else {
          const test = Campaigns.find(x => x.title === 'testing');
          const log = test?.logs[0];
          if (test && log) {
            await this.viewerService.loadHtml(test, log);
          }
        }
      });
  }

  onScroll(event: any) {
    if (this.viewerService.curImages.length) {
      this.curPos = event.srcElement.scrollTop + (event.srcElement.clientHeight / 2);
      if (this.curPos < this.viewerService.curY || this.curPos >= this.viewerService.nextY) {
        this.viewerService.loadImage(this.curPos);
      }
    }
  }

}
