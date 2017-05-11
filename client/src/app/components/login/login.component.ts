import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service.js';
import { SharedService } from '../../services/shared.service.js';

@Component({
    moduleId: module.id,
    selector: 'ss-login',
    templateUrl: 'login.component.html',
    styleUrls: ['login.component.css'],
})

export class LoginComponent {
    logo: string = 'src/media/logo.jpg';
    username: string;
    password: string;
    errstr: string;

    constructor(private _authService: AuthenticationService, 
                private _sharedService: SharedService, 
                private _router: Router) { 
                    if(localStorage.getItem("currentUser")){
                        _router.navigate(["/"]);
                    }
                }

    login() {
        this._authService.login(this.username, this.password)
            .subscribe(
                result => this.handleLoginResult(result),
                error => console.log(error)
            );
    }

    handleLoginResult(result: any) {
        if (result.errno == '0') {
            localStorage.setItem('currentUser', this.username);
            this._sharedService.setLoginStatus(true);
            this._router.navigate(['/']);
        }
        else {
            this.errstr = result.errstr;
            this._sharedService.setLoginStatus(false);
        }
    }
}