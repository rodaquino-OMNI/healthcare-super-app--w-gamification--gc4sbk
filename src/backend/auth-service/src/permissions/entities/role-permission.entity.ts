/**
 * @file Role-Permission junction entity for the AUSTA SuperApp authentication system
 * @module auth-service/permissions/entities/role-permission
 */

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from './permission.entity';
import { IPermission } from '@austa/interfaces/auth/permission.interface';

/**
 * RolePermission entity representing the many-to-many relationship between roles and permissions.
 * This junction table enables the role-based access control system by mapping which permissions
 * are assigned to each role in the AUSTA SuperApp.
 */
@Entity('role_permissions')
export class RolePermission {
  /**
   * Unique identifier for the role-permission relationship
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID of the role to which the permission is assigned
   */
  @Column({ name: 'role_id' })
  roleId: number;

  /**
   * ID of the permission being assigned to the role
   */
  @Column({ name: 'permission_id' })
  permissionId: number;

  /**
   * Reference to the role entity
   */
  @ManyToOne(() => Role, (role) => role.permissions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  /**
   * Reference to the permission entity
   */
  @ManyToOne(() => Permission, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission & IPermission;

  /**
   * Timestamp of when the permission was assigned to the role
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp of when the role-permission relationship was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}