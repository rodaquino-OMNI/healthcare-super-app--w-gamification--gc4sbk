import { 
  Entity, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Unique
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { Permission } from './permission.entity';
import { IUserPermission } from '@austa/interfaces/auth';

/**
 * UserPermission entity representing a direct permission assignment to a user.
 * 
 * This junction entity enables fine-grained control over user permissions by allowing
 * permissions to be assigned directly to users, bypassing the role-based permission system.
 * This is useful for exceptional cases where role-based permissions are insufficient or
 * when temporary permissions need to be granted to specific users.
 * 
 * The entity maintains relationships to both User and Permission entities and includes
 * metadata about when the permission was granted and by whom.
 */
@Entity()
@Unique(['userId', 'permissionId']) // Prevent duplicate permission assignments
export class UserPermission implements IUserPermission {
  /**
   * Unique identifier for the user-permission relationship
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID of the user to whom the permission is assigned
   */
  @Column()
  userId: string;

  /**
   * ID of the permission being assigned to the user
   */
  @Column()
  permissionId: number;

  /**
   * Optional reason for granting this specific permission
   */
  @Column({ nullable: true })
  reason: string;

  /**
   * ID of the user who granted this permission (for audit purposes)
   */
  @Column({ nullable: true })
  grantedBy: string;

  /**
   * Optional expiration date for temporary permissions
   */
  @Column({ nullable: true })
  expiresAt: Date;

  /**
   * Reference to the user entity
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Reference to the permission entity
   */
  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  /**
   * Timestamp of when the permission was granted to the user
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp of when the user-permission relationship was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;
}