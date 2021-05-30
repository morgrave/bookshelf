import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-viewer-image',
  templateUrl: './viewer-image.component.html',
  styleUrls: ['./viewer-image.component.scss']
})
export class ViewerImageComponent implements OnInit {
  @Input() image: string = ``;

  constructor(
  ) { }

  ngOnInit() {
  }

}
