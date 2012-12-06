class Api::CallbacksController < Devise::OmniauthCallbacksController
  # this may be needed, but haven't needed it yet.
  #skip_before_filter :verify_authenticity_token, :only => [:open_id]

  # NOTES

  # https://github.com/intridea/omniauth/wiki/Managing-Multiple-Providers
  # Typically authentication systems have a User model which handles most of the
  # authentication logic but having multiple logins forces you to correctly separate
  # the concepts of an Identity and a User. An Identity is a particular authentication
  # method which a user has used to identify themselves with your site whilst a User
  # manages data which is directly related to your site itself.

  # good info about the omniauth flow
  # http://www.arailsdemo.com/posts/18

  # see https://gist.github.com/993566

  # END NOTES

  # any failure
  def failure
    #set_flash_message :alert, :failure, :kind => failed_strategy.name.to_s.humanize, :reason => failure_message
    #redirect_to after_omniauth_failure_path_for(resource_name)

    #render :json => {:response => 'failure', :provider_id => failed_strategy.name.to_s, :reason => failure_message}.to_json, :status => :bad_request

    window_data = {:response => 'failure', :provider_id => failed_strategy.name.to_s, :reason => failure_message}
    javascript_data = "<script type='text/javascript'>(function(){ returneddata = #{window_data.to_json}; window.close(); return false;})()</script>"
    displayed_data = '<p>Authentication callback page. If you are seeing this page, something went wrong. <a href="/">Return to homepage</a>.</p>'
    window_content = "<!DOCTYPE html><head></head><body>#{displayed_data} #{javascript_data}</body></html>"

    # use this javscript to get access to the returned data
    # returneddata = 0; dataitem = window.open('/security/auth/open_id/callback', 'dataitem'); dataitem.returneddata = returneddata;
    # to access the object: dataitem.returneddata
    render :text => window_content, :status => :bad_request
  end

  def success_complete(canonical_data)
    user = store_provider_info(canonical_data, current_user)

    sign_in(user, :event => :authentication)

    current_user.reset_authentication_token!
    content = Api::SessionsController.login_info(current_user, user, canonical_data[:canonical][:provider])

    respond_to do |format|
      format.json { render :json => content.as_json, :status => :ok }
      format.xml { render :xml => content.to_xml, :status => :ok }
      format.any { render :json => content.as_json, :status => :ok }
    end
  end

  #
  # External providers
  #

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
            canonical_data = browser_id_info(verify_response_attr)

            success_complete(canonical_data)

          end
        end
      end

      # success, reset any existing tokens and
      # return a new token for this session
      #
      #head :ok

    end
  end

  def open_id
    canonical_data = open_id_info(request.env["omniauth.auth"])
    success_complete(canonical_data)
  end

  private

  def browser_id_info(raw)
    {
        :canonical =>
            {
                :provider => 'browser_id',
                :uid => raw[:email],
                #:user_id =>,
                :token => raw[:issuer], # stores issuer instead
                :secret => raw[:expires], # stores expirses instead
                :name => nil,
                :link => 'https://persona.org' # link to external provider profile when logged in
            },
        :email => raw[:email],
        :display_name => nil
    }
  end

  def open_id_info(raw)
    {
        :canonical =>
            {
                :provider => 'open_id',
                :uid => raw.uid,
                #:user_id =>,
                :token => raw.extra.response.endpoint.local_id, # stores open id issuer/server instead
                :secret => nil,
                :name => if raw.info.include?(:name) then
                           raw.info.name
                         elsif raw.info.include?(:nickname) then
                           raw.info.nickname
                         else
                           nil
                         end,
                :link => raw.extra.response.identity_url
            },
        :email => raw.info.include?(:email) ? raw.info.email : '',
        :display_name => raw.info.include?(:nickname) ? raw.info.nickname : nil,
    }
  end

  def store_provider_info(canonical_data,resource=nil)
    user = resource

    if user.blank?
      authn = Authorization.find_by_uid(canonical_data[:canonical][:uid])
      user = authn.user unless authn.blank?
      user = User.find_by_email(canonical_data[:email]) if !canonical_data[:email].blank? && user.blank?
      user = User.find_by_display_name(canonical_data[:display_name]) if !canonical_data[:display_name].blank? && user.blank?
      user = User.create!(:display_name => canonical_data[:display_name], :email => canonical_data[:email], :password => Devise.friendly_token[0,20]) if user.blank?
    end

    # update display_name if given and it was blank
    if user.display_name.blank? && !canonical_data[:display_name].blank?
      user.display_name = canonical_data[:display_name]
    end

    # update email is given and it was blank
    if user.email.blank? && !canonical_data[:email].blank?
      user.email = canonical_data[:email]
    end

    raise 'Could not find or create a user for external provider information' if user.blank?

    auth = user.authorizations.find_by_provider(canonical_data[:canonical][:provider])
    if auth.nil?
      auth = user.authorizations.build(:provider => canonical_data[:canonical][:provider])
      user.authorizations.push(auth)
    end

    # update all auth attributes. This will remove info if it is not provided in canonical_data[:canonical].
    auth.update_attributes canonical_data[:canonical]

    user
  end

  def construct_post(endpoint_uri, body)
    post_request = Net::HTTP::Post.new(endpoint_uri.request_uri)
    post_request["Content-Type"] = "application/json"
    post_request["Accept"] = "application/json"
    post_request.body = body.to_json
    post_request
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