import { LocationStrategy } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map } from 'rxjs/operators';
import { Campaign, Log } from '../shared/models/campaigns.model';

@Injectable()
export class ViewerService {
  headers = new HttpHeaders({
    'Content-Type':  'text/plain',
  });
  requestOptions: Object = {
    headers: this.headers,
    responseType: 'text'
  }
  scss: SafeHtml = ``;
  log: SafeHtml = ``;
  image: string = ``;
  baseHref = this.locationStrategy.getBaseHref();
  curTitle = ``;
  curIndex = ``;
  curImages: any[] = [];
  curY = 0;
  nextY = 0;

  constructor(
    private locationStrategy: LocationStrategy,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  async loadHtml(campaign: Campaign, log: Log) {
    this.log = ``;
    this.curTitle = campaign.title;
    this.curIndex = log.index;
    this.curImages = log.images ? log.images : [];
    if (this.curImages.length) {
      this.image = `${this.baseHref}assets/${this.curTitle}/images/${this.curIndex}/${this.curImages[0].file}`;
      this.curY = this.curImages[0].y;
      if (this.curImages.length > 1) {
        this.nextY = this.curImages[1].y;
      }
      else {
        this.nextY = Infinity;
      }
    }
    else {
      this.curY = 0;
      this.nextY = 0;
    }
    if (!this.scss) {
      await this.http
        .get<string>(`${this.baseHref}assets/common.scss`, this.requestOptions)
        .pipe(
          map((res) => {
            this.scss = this.sanitizer.bypassSecurityTrustHtml(res);
            return;
          })
        )
        .toPromise();
    }
    const html = await this.http
      .get<string>(`${this.baseHref}assets/${campaign.title}/logs/${log.index}.html`, this.requestOptions)
      .pipe(
        map((res) => {
          this.log = this.sanitizer.bypassSecurityTrustHtml(res + `<style>${this.scss}</style>`);
          return;
        })
      )
      .toPromise();
    return;
  }

  loadImage(y: number) {
    let imgIndex = 0;
    this.curImages.forEach((x, cnt) => {
      if (x.y <= y) {
        imgIndex = cnt;
        this.curY = this.curImages[imgIndex].y;
        this.nextY = imgIndex === this.curImages.length - 1 ? Infinity : this.curImages[imgIndex + 1].y;
      }
    });
    this.image = `${this.baseHref}assets/${this.curTitle}/images/${this.curIndex}/${this.curImages[imgIndex].file}`;
  }
}
