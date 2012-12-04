class Api::CallbacksController < Devise::OmniauthCallbacksController
  # see https://gist.github.com/993566

  # https://github.com/intridea/omniauth/wiki/Managing-Multiple-Providers
  # Typically authentication systems have a User model which handles most of the
  # authentication logic but having multiple logins forces you to correctly separate
  # the concepts of an Identity and a User. An Identity is a particular authentication
  # method which a user has used to identify themselves with your site whilst a User
  # manages data which is directly related to your site itself.

  #respond_to :json

  def browser_id
    # https://developer.mozilla.org/en-US/docs/Persona/Remote_Verification_API
    # this callback will have an assertion included. The assertion should be POST'ed with the
    # audience to the remote verification API


    if params[:assertion].blank?

      head :bad_request
    else

      base_uri = "#{request.protocol}#{request.host_with_port}"
      body = { :audience => base_uri, :assertion => params[:assertion]}
      verify_uri = URI.parse('https://verifier.login.persona.org/verify')
      post_request = construct_post(verify_uri, body)
      Net::HTTP.start(verify_uri.host, verify_uri.port,:use_ssl => verify_uri.scheme == 'https') do |http|
        verify_response = http.request(post_request)
        Rails.logger.debug "Verify browser_id response: #{verify_response.code}, Message: #{verify_response.message}, Body: #{verify_response.body}"
        if verify_response.code == '200'
          verify_response_attr = JSON.parse(verify_response.body, { :symbolize_names => true })
          if verify_response_attr[:status] == 'okay'
            user = store_provider_info('browser_id',verify_response_attr, current_user)

            sign_in(user, :event => :authentication)
            current_user.reset_authentication_token!

            respond_to do |format|
              format.json do
                content = Api::SessionsController.login_info(current_user, user, 'browser_id')
                render :json => content.to_json, :status => :ok
              end
            end

          end
        end
      end

      # success, reset any existing tokens and
      # return a new token for this session
      #
      #head :ok

    end
  end

  private

  def store_provider_info(provider, access_token, resource=nil)
    user = nil
    email = nil
    display_name = nil
    uid = nil
    auth_attr = {}

    case provider
      when 'browser_id'
        uid = access_token[:email]
        email = access_token[:email]
        # using the token field to store the issuer identity
        # using the secret field to store the expires time
        auth_attr = { :uid => uid, :token => access_token[:issuer],
                      :secret => access_token[:expires], :link => 'https://persona.org' }

      else
        raise "Provider '#{provider}' not handled."
    end

    if resource.nil?
      if email
        user = find_or_create_by_name(display_name, email, resource)
      elsif uid && name
        user = find_or_create_by_uid(uid, display_name, email, resource)
        if user.nil?
          user = find_or_create_by_display_name(display_name, email, resource)
        end
      end
    else
      user = resource
    end

    auth = user.authorizations.find_by_provider(provider)
    if auth.nil?
      auth = user.authorizations.build(:provider => provider)
      user.authorizations << auth
    end

    auth.update_attributes auth_attr

    user
  end

  def find_or_create_by_uid(uid, display_name, email, resource=nil)
    user = Authorization.find_by_uid(uid.to_s)
    if user.blank?
      user = User.new(:display_name => display_name, :email => email, :password => Devise.friendly_token[0,20])
      user.save
    end
    user
  end

  def find_or_create_by_display_name(display_name, email, resource=nil)
    user = User.find_by_email(email)
    if user.blank?
      user = User.new(:display_name => display_name, :email => email, :password => Devise.friendly_token[0,20])
      user.save
    end
    user
  end

  def find_or_create_by_name(display_name, email, resource=nil)
    user = User.find_by_display_name(display_name)
    if user.blank?
      user = User.new(:display_name => display_name, :email => email, :password => Devise.friendly_token[0,20], )
      # save(false) will skip validations
      user.save(:validate => false)
    end
    user
  end

  def construct_post(endpoint_uri, body)
    post_request = Net::HTTP::Post.new(endpoint_uri.request_uri)
    post_request["Content-Type"] = "application/json"
    post_request["Accept"] = "application/json"
    post_request.body = body.to_json
    post_request
  end

  def construct_browser_id_attrs(response_body)

  end

  def find_or_create_user_by_email(email, display_name)
    user = User.find_by_email(email)
    if user
      user
    else
      user = User.new(:display_name => display_name, :email => email, :password => Devise.friendly_token[0,20])
      user.save
    end
    user
  end

=begin

  require 'uuidtools'

  def facebook
    oauthorize "Facebook"
  end

  def twitter
    oauthorize "Twitter"
  end

  def linked_in
    oauthorize "LinkedIn"
  end

  def passthru
    render :file => "#{Rails.root}/public/404.html", :status => 404, :layout => false
  end

  private

  def oauthorize(kind)
    @user = find_for_ouath(kind, env["omniauth.auth"], current_user)
    if @user
      flash[:notice] = I18n.t "devise.omniauth_callbacks.success", :kind => kind
      session["devise.#{kind.downcase}_data"] = env["omniauth.auth"]
      sign_in_and_redirect @user, :event => :authentication
    end
  end

  def find_for_ouath(provider, access_token, resource=nil)
    user, email, name, uid, auth_attr = nil, nil, nil, {}
    case provider
      when "Facebook"
        uid = access_token['uid']
        email = access_token['extra']['user_hash']['email']
        auth_attr = { :uid => uid, :token => access_token['credentials']['token'], :secret => nil, :name => access_token['extra']['user_hash']['name'], :link => access_token['extra']['user_hash']['link'] }
      when "Twitter"
        uid = access_token['extra']['user_hash']['id']
        name = access_token['user_info']['name']
        auth_attr = { :uid => uid, :token => access_token['credentials']['token'], :secret => access_token['credentials']['secret'], :name => name, :link => "http://twitter.com/#{name}" }
      when 'LinkedIn'
        uid = access_token['uid']
        name = access_token['user_info']['name']
        auth_attr = { :uid => uid, :token => access_token['credentials']['token'], :secret => access_token['credentials']['secret'], :name => name, :link => access_token['user_info']['public_profile_url'] }
      else
        raise 'Provider #{provider} not handled'
    end
    if resource.nil?
      if email
        user = find_for_oauth_by_email(email, resource)
      elsif uid && name
        user = find_for_oauth_by_uid(uid, resource)
        if user.nil?
          user = find_for_oauth_by_name(name, resource)
        end
      end
    else
      user = resource
    end

    auth = user.authorizations.find_by_provider(provider)
    if auth.nil?
      auth = user.authorizations.build(:provider => provider)
      user.authorizations << auth
    end
    auth.update_attributes auth_attr

    return user
  end


=end
end