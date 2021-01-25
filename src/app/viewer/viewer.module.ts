import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { ViewerService } from './viewer.service';
import { RouterModule } from '@angular/router';
import { ViewerPlaylogComponent } from './containers/viewer-playlog.component';
import { ViewerTextComponent } from './components/viewer-text.component';
import { ViewerImageomponent } from './components/viewer-image.component';

@NgModule({
  declarations: [
    ViewerTextComponent,
    ViewerImageomponent,
    ViewerPlaylogComponent,
  ],
  imports: [
    CommonModule,
    ClarityModule,
    RouterModule,
  ],
  providers: [ViewerService],
  exports: [ViewerPlaylogComponent],
})
export class ViewerModule { }
