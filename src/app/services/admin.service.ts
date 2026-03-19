import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserDto, CreateUserDto, UpdateUserDto } from '../core/models/user.models';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl = `${environment.apiUrl}/admin`;

    constructor(private http: HttpClient) { }

    
    getAllUsers(): Observable<UserDto[]> {
        return this.http.get<UserDto[]>(`${this.apiUrl}/users`);
    }

    createUser(userData: CreateUserDto): Observable<any> {
        return this.http.post(`${this.apiUrl}/users`, userData);
    }

    updateUserDetails(userId: number, details: UpdateUserDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/${userId}`, details);
    }

    deleteUser(userId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${userId}`);
    }

    scanForm(file: File) {
        const form = new FormData();
        form.append('file', file);
        return this.http.post<any>(`${this.apiUrl}/scan-form`, form);
    }
}
