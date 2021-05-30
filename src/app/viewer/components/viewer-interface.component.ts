import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-viewer-interface',
  templateUrl: './viewer-interface.component.html',
  styleUrls: ['./viewer-interface.component.scss']
})
export class ViewerInterfaceComponent implements OnInit {
  @Input() interface: string = ``;

  constructor(
  ) { }

  ngOnInit() {
  }

}
