import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { HttpModule } from '@angular/http';
import { FileUploadModule } from 'ng2-file-upload';

import { AppComponent } from './app.component'
import { LoginComponent } from './components/login/login.component'
import { NavbarComponent } from './components/navbar/navbar.component'
import { HomeComponent } from './components/home/home.component'
import { CreateAccountComponent } from './components/create-account/create-account.component'
import { SearchResultComponent } from './components/search-result/search-result.component'
import { RelatedDocsComponent } from './components/related-docs/related-docs.component'
import { ProfileComponent } from './components/profile/profile.component'
import { ArticleComponent } from './components/article/article.component'
import { ArticleUploadComponent } from './components/article-upload/article-upload.component'

import * as $ from 'jquery';

const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'createaccount', component: CreateAccountComponent },
  { path: 'searchresult/:term', component: SearchResultComponent },
  { path: 'relateddocs/:docid', component: RelatedDocsComponent },
  { path: 'profile/:username', component: ProfileComponent },
  { path: 'article/:id', component: ArticleComponent },
  { path: 'article/upload/:username', component: ArticleUploadComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    FileUploadModule,
    RouterModule.forRoot(appRoutes, { useHash: true })
  ],
  declarations: [ AppComponent, LoginComponent, NavbarComponent, HomeComponent,
                  CreateAccountComponent, SearchResultComponent, ProfileComponent,
                  ArticleComponent, ArticleUploadComponent, RelatedDocsComponent,
                ],
  bootstrap: [AppComponent]
})
export class AppModule { }
