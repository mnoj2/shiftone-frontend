export interface UserDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  isWorking?: boolean;
}

export interface CreateUserDto {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: string;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  id?: number;
}
