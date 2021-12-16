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
  interface: string = ``;
  baseHref = this.locationStrategy.getBaseHref();
  curTitle = ``;
  curIndex = ``;
  curImages: any[] = [];
  curInterfaces: any[] = [];
  mode: 'dev' | 'prod' = 'prod';

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
    this.curInterfaces = log.interfaces ? log.interfaces : [];
    if (this.curImages.length) {
      this.loadImage(0);
    }
    if (this.curInterfaces.length) {
      this.loadInterface(0);
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
          if (this.mode === 'prod') {
            this.log = this.sanitizer.bypassSecurityTrustHtml(campaign.npcs?.reduce((res, npc) => {
              const regexp = new RegExp(`<span class="by">${npc.name}:</span>*`, 'gi');
              return res.replace(regexp, `<div class="avatar" aria-hidden="true"><img src="${npc.avatar}"/></div><span class="by">${npc.name}:</span>`);
            }, res).replace(/data-messageid/gi, `id`) + `<style>${this.scss}</style>`);
          }
          else {
            this.log = this.sanitizer.bypassSecurityTrustHtml(campaign.npcs?.reduce((res, npc) => {
              const regexp = new RegExp(`<span class="by">${npc.name}:</span>*`, 'gi');
              return res.replace(regexp, `<div class="avatar" aria-hidden="true"><img src="${npc.avatar}"/></div><span class="by">${npc.name}:</span>`);
            }, res).replace(/data-messageid="([-\w]{20})">/gi, `id="$1"><button onClick='const t = document.createElement("textarea");
            document.body.appendChild(t);
            t.value = "$1";
            t.select();
            document.execCommand("copy");
            document.body.removeChild(t);'>복사</button>`) + `<style>${this.scss}</style>`);
          }
          return;
        })
      )
      .toPromise();
    return;
  }

  loadImage(index: number) {
    this.image = `${this.baseHref}assets/${this.curTitle}/images/${this.curIndex}/${this.curImages[index].file}`;
  }

  loadInterface(index: number) {
    if (this.curInterfaces[index].file) {
      this.interface = `${this.baseHref}assets/${this.curTitle}/images/${this.curIndex}/interfaces/${this.curInterfaces[index].file}`;
    }
    else {
      this.interface = ``;
    }
  }
}
