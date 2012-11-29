class Api::RegistrationsController < Devise::RegistrationsController
  respond_to :json
  # see C:\Ruby\193\lib\ruby\gems\1.9.1\gems\devise-2.1.2\app\controllers\devise

  # GET /resource/sign_up
  def new
    resource = build_resource(params[:user])
    respond_with resource
  end

  # POST /resource
  def create
    user = User.new(params[:user])
    if user.save
      render :json=> user.as_json(:auth_token=>user.authentication_token, :email=>user.email), :status=>201
    else
      warden.custom_failure!
      render :json=> user.errors, :status=>422
    end
  end
=begin
  def update
    if params[resource_name][:password].blank?
      params[resource_name].delete(:password)
      params[resource_name].delete(:password_confirmation) if params[resource_name][:password_confirmation].blank?
    end
    # Override Devise to use update_attributes instead of update_with_password.
    # This is the only change we make.
    if resource.update_attributes(params[resource_name])
      set_flash_message :notice, :updated
      # Line below required if using Devise >= 1.2.0
      sign_in resource_name, resource, :bypass => true
      redirect_to after_update_path_for(resource)
    else
      clean_up_passwords(resource)
      render_with_scope :edit
    end
  end
=end
end