class Ability
  include CanCan::Ability

  allowed_permission_types = %w(Project)

  def initialize(user)

    # The can method is used to define permissions and requires two arguments.
    # The first one is the action you're setting the permission for, the second one
    # is the class of object you're setting it on.



    user ||= User.new # guest user (not logged in)
    if user.admin?
      can :manage, :all
    else
      # https://github.com/ryanb/cancan/wiki/Abilities-in-Database
      can do |level, permissionable_type, permissionable_item|
        user.permissions.find_all_by_level(aliases_for_action(level)).any? do |permission|

          permission_type = permissionable_type.to_s

          if user.id.blank?
            # I think this will catch guest users
          end

          if permission_type != 'Project'
            # use the Permission model to find the applicable Project id permission to use

            permission_type = 'Project'
          end

          types_match = permission.permissionable_type == permissionable_type.to_s

          id_missing = permissionable_item.blank? || permission.permissionable_id.blank?
          ids_match = id_missing ? true : permission.permissionable_id == permissionable_item.id

          #permission.permissionable_type == permissionable_type.to_s &&
          #    (permissionable_id.blank? || permission.permissionable_id.nil? || permission.permissionable_id == permissionable_id.id)

          types_match && ids_match
        end
      end
    end


    # Define abilities for the passed in user here. For example:
    #
    #
    #   if user.admin?
    #     can :manage, :all
    #   else
    #     can :read, :all
    #   end
    #
    # The first argument to `can` is the action you are giving the user permission to do.
    # If you pass :manage it will apply to every action. Other common actions here are
    # :read, :create, :update and :destroy.
    #
    # The second argument is the resource the user can perform the action on. If you pass
    # :all it will apply to every resource. Otherwise pass a Ruby class of the resource.
    #
    # The third argument is an optional hash of conditions to further filter the objects.
    # For example, here the user can only update published articles.
    #
    #   can :update, Article, :published => true
    #
    # See the wiki for details: https://github.com/ryanb/cancan/wiki/Defining-Abilities
  end
end
