class Api::SessionsController < Devise::SessionsController

=begin
  e.g.
  GET http://localhost:3000/projects
  Accept: application/json
  Content-Type: application/json
  Authorization: Token token="TOKEN"
  Host: localhost:3000
  Content-Length: 0
=end

  # GET /resource/sign_in
  def new
    resource = build_resource(nil, :unsafe => true)
    clean_up_passwords(resource)
    respond_with(resource, serialize_options(resource))
  end

  # POST /resource/sign_in
  def create
    # turn off session storage for json and xml
    # http://stackoverflow.com/questions/10717667/prevent-session-creation-on-rails-3-2-2-for-restful-api/10723769#10723769
    auth_options.deep_merge!({:store => !(request.format.xml? || request.format.json?)})
    resource = warden.authenticate!(auth_options)
    set_flash_message(:notice, :signed_in) if is_navigational_format?
    sign_in(resource_name, resource)

    respond_to do |format|
      format.html do
        respond_with resource, :location => after_sign_in_path_for(resource)
      end
      format.json do
        # http://stackoverflow.com/questions/9641079/token-authentication-with-rails-and-devise
        # http://matteomelani.wordpress.com/2011/10/17/authentication-for-mobile-devices/
        current_user.ensure_authentication_token!
        render :json => login_info(current_user,resource, 'default').to_json, :status => :ok
      end
    end

  end

  # DELETE (or GET depending on devise setting) /resource/sign_out
  def destroy
    # don't redirect at all
    #redirect_path = after_sign_out_path_for(resource_name)
    # still sign out
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    #set_flash_message :notice, :signed_out if signed_out

    # We actually need to hardcode this as Rails default responder doesn't
    # support returning empty response on GET request
    # only respond with a HEAD 200 OK.
    respond_to do |format|
      #format.any(*navigational_formats) { redirect_to redirect_path }
      format.all do
        head :ok
      end
    end
  end

  # returns 401 or 200 depending on if a user is signed in or not
  def ping
    if user_signed_in?
      head :ok
    else
      head :unauthorized
    end
  end

  private

  def self.login_info(current_user, user, provider_id)
    { :response => 'ok',
      :user_id => user.id,
      :auth_token => current_user.authentication_token,
      :friendly_name => user.display_name,
      :provider_id => provider_id,
      :email => user.email
    }
  end

  # https://github.com/plataformatec/devise/issues/1357
  # redirect the user after signing in
  #def after_sign_in_path_for(resource)
  #  session_return_to = session[:return_to]
  #  session[:return_to] = nil
  #  stored_location_for(resource) || session_return_to || root_path
  #end

=begin
  before_filter :authenticate_user!, :except => [:create, :destroy]
  before_filter :ensure_params_exist
  respond_to :json
  # see http://jessewolgamott.com/blog/2012/01/19/the-one-with-a-json-api-login-using-devise/

  def create
    resource = User.find_for_database_authentication(:email => params[:user_login][:email])
    return invalid_login_attempt unless resource

    if resource.valid_password?(params[:user_login][:password])
      sign_in(:user, resource)
      resource.ensure_authentication_token!
      render :json=> {:success=>true, :auth_token=>resource.authentication_token, :email=>resource.email}
      return
    end
    invalid_login_attempt
  end

  def destroy
    resource = User.find_for_database_authentication(:email => params[:user_login][:email])
    resource.authentication_token = nil
    resource.save
    render :json=> {:success=>true}
  end

  protected

  def ensure_params_exist
    return unless params[:user_login].blank?
    render :json => { :success => false, :message => "Missing user_login parameter." }, :status => 422
  end

  def invalid_login_attempt
    render :json => { :success => false, :message => "Login was not successful." }, :status => 401
  end
=end
end