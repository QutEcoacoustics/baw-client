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

  # oauth example
  # see https://gist.github.com/993566

  # END NOTES

  # any failure

  def javascript_data data
    "<script type='text/javascript'>function closeWindow(){ returneddata = #{data.to_json}; window.close(); return false;};(closeWindow)()</script>"
  end

  def window_content display_data, data
    "<!DOCTYPE html><head></head><body>#{display_data} #{javascript_data data}</body></html>"
  end

  def failure
    #set_flash_message :alert, :failure, :kind => failed_strategy.name.to_s.humanize, :reason => failure_message
    #redirect_to after_omniauth_failure_path_for(resource_name)

    #render :json => {:response => 'failure', :provider_id => failed_strategy.name.to_s, :reason => failure_message}.to_json, :status => :bad_request
    displayed_data = '<p>Login unsuccessful. <a href="#" onclick="javascript:closeWindow();return false;">Close this window</a>.</p>'
    window_data = Api::SessionsController.fail_login_info(failure_message, failed_strategy.name.to_s)

    # use this javscript to get access to the returned data
    # returneddata = 0; dataitem = window.open('/security/auth/open_id/callback', 'dataitem'); dataitem.returneddata = returneddata;
    # to access the object: dataitem.returneddata

    Rails.logger.warn("Log in failed. Data: #{window_data.as_json}; Params: #{params}")

    respond_to do |format|
      format.json { render :json => window_data.as_json, :status => :unauthorized }
      format.js { render :json => window_data.as_json, :status => :unauthorized }
      format.xml { render :xml => window_data.to_xml, :status => :unauthorized }
      format.any { render :text => window_content(displayed_data, window_data), :status => :unauthorized }
    end
  end

  def success_complete(canonical_data)
    displayed_data = '<p>Login successful. Please <a href="#" onclick="javascript:closeWindow();return false;">close</a> this window.</p>'

    user = store_provider_info(canonical_data, current_user)

    sign_in(user, :event => :authentication)

    unless current_user.blank?
      current_user.reset_authentication_token!
    end

    content = Api::SessionsController.login_info(current_user, user, canonical_data[:authorization][:provider])

    Rails.logger.debug("Log in succeeded. Data: #{content.as_json}; Params: #{params}")

    respond_to do |format|
      format.json { render :json => content.as_json, :status => :ok }
      format.js { render :json => content.as_json, :status => :ok }
      format.xml { render :xml => content.to_xml, :status => :ok }
      format.any { render :text => window_content(displayed_data, content), :status => :ok }
    end
  end

  #
  # External providers
  #

  # available information:
  # response, env, current_user, params

  def browser_id
    # https://developer.mozilla.org/en-US/docs/Persona/Remote_Verification_API
    # this callback will have an assertion included. The assertion should be POST'ed with the
    # audience to the remote verification API

    if params[:assertion].blank?

      head :bad_request
    else

      base_uri = "#{request.protocol}#{request.host_with_port}"
      body = {:audience => base_uri, :assertion => params[:assertion]}
      verify_uri = URI.parse('https://verifier.login.persona.org/verify')
      post_request = construct_post(verify_uri, body)
      Net::HTTP.start(verify_uri.host, verify_uri.port, :use_ssl => verify_uri.scheme == 'https') do |http|
        verify_response = http.request(post_request)
        Rails.logger.debug "Verify browser_id response: #{verify_response.code}, Message: #{verify_response.message}, Body: #{verify_response.body}"
        if verify_response.code == '200'
          verify_response_attr = JSON.parse(verify_response.body, {:symbolize_names => true})
          if verify_response_attr[:status] == 'okay'
            canonical_data = browser_id_info(verify_response_attr)

            success_complete(canonical_data)

          end
        end
      end
    end
  end

  def open_id
    canonical_data = open_id_info(request.env["omniauth.auth"])
    success_complete(canonical_data)
  end

  def facebook
    canonical_data = facebook_info(request.env["omniauth.auth"])
    success_complete(canonical_data)
  end

  def twitter
    canonical_data = twitter_info(request.env["omniauth.auth"])
    success_complete(canonical_data)
  end

  def github
    canonical_data = github_info(request.env["omniauth.auth"])
    success_complete(canonical_data)
  end

  def windowslive
    canonical_data = windows_live_info(request.env["omniauth.auth"])
    success_complete(canonical_data)
  end

  def linked_in
    canonical_data = linked_in_info(request.env["omniauth.auth"])
    success_complete(canonical_data)
  end

  private

  # The provider names must match those used on services.js and application.html.erb

  def browser_id_info(raw)
    {
        authorization:
            {
                #id:
                provider: 'persona',
                uid: raw[:email],
                #user_id
                token: raw[:issuer], # stores issuer instead
                secret: raw[:expires], # stores expires instead
                name: nil,
                link: 'https://persona.org' # link to external provider profile when logged in
                #created_at
                #updated_at
            },
        user:
            {
                display_name: nil,
                email: raw[:email],
                is_fake_email: false,
                user_name: nil
            }
    }
  end

  def open_id_info(raw)

    open_id_name = raw.info.include?(:name) ? raw.info.name : ''
    open_id_nickname = raw.info.include?(:nickname) ? raw.info.nickname : ''
    open_id_any_name = open_id_nickname.blank? ?
        (open_id_name.blank? ? '' : open_id_name) :
        open_id_nickname

    open_id_email = raw.info.include?(:email) ? raw.info.email : ''
    open_id_local_or_claimed_url = raw.extra.response.endpoint.local_id.blank? ?
        (raw.extra.response.endpoint.claimed_id.blank? ? '' : raw.extra.response.endpoint.claimed_id) :
        raw.extra.response.endpoint.local_id

    {
        authorization:
            {
                #id:
                provider: 'open_id',
                uid: raw.uid,
                #user_id
                token: open_id_local_or_claimed_url, # stores open id issuer/server instead
                secret: nil,
                name: open_id_any_name,
                link: raw.extra.response.identity_url
            },
        user:
            {
                display_name: open_id_any_name,
                email: open_id_email,
                is_fake_email: false,
                user_name: open_id_any_name
            }
    }
  end

  def facebook_info(raw)

    facebook_name = raw.info.include?(:name) ? raw.info.name : ''
    facebook_nickname = raw.info.include?(:nickname) ? raw.info.nickname : ''
    facebook_any_name = facebook_name.blank? ? (facebook_nickname.blank? ? '' : facebook_nickname) : facebook_name
    facebook_email = raw.info.include?(:email) ? raw.info.email : ''

    {
        authorization:
            {
                #id:
                provider: 'facebook',
                uid: raw.uid,
                #user_id
                token: raw.extra.response.endpoint.local_id, # stores open id issuer/server instead
                secret: nil,
                name: facebook_any_name,
                link: raw.extra.response.identity_url
            },
        user:
            {
                display_name: facebook_name,
                email: facebook_email,
                is_fake_email: false,
                user_name: facebook_nickname
            }
    }
  end

  def twitter_info(raw)

    twitter_name = raw['info'].include?('name') ? raw['info']['name'] : ''
    twitter_nickname = raw['info'].include?('nickname') ? raw['info']['nickname'] : ''
    twitter_any_name = twitter_name.blank? ? (twitter_nickname.blank? ? '' : twitter_nickname) : twitter_name

    # create a unique, dummy email, since twitter doesn't provide one
    # set dummy email to true, so that this email is never shown
    fake_email = raw['uid'].gsub(/[^0-9a-zA-Z]/, '_')+'.twitter@example.com'

    {
        authorization:
            {
                provider: 'twitter',
                uid: raw['uid'],
                token: raw['credentials']['token'],
                secret: raw['credentials']['secret'],
                name: twitter_nickname,
                link: "http://twitter.com/#{raw['info']['nickname']}"
            },
        user: {
            display_name: twitter_name,
            email: fake_email,
            is_fake_email: true,
            user_name: twitter_nickname
        },
        image: raw['info'].include?('image') ? raw['info']['image'] : '',
        description: raw['info'].include?('description') ? raw['info']['description'] : '',
        location: raw['info'].include?('location') ? raw['info']['location'] : ''
    }
  end

  def github_info(raw)
    {
        authorization:
            {
                provider: 'github',
                uid: nil,
                token: nil,
                secret: nil,
                name: nil,
                link: nil
            },
        user: {
            display_name: nil,
            email: nil,
            is_fake_email: nil,
            user_name: nil
        }
    }
  end

  def windows_live_info(raw)
    {
        authorization:
            {
                provider: 'github',
                uid: nil,
                token: nil,
                secret: nil,
                name: nil,
                link: nil
            },
        user: {
            display_name: nil,
            email: nil,
            is_fake_email: nil,
            user_name: nil
        }
    }
  end

  def linked_in_info(raw)
    {
        authorization:
            {
                provider: 'github',
                uid: nil,
                token: nil,
                secret: nil,
                name: nil,
                link: nil
            },
        user: {
            display_name: nil,
            email: nil,
            is_fake_email: nil,
            user_name: nil
        }
    }
  end

  def store_provider_info(canonical_data, resource=nil)
    user = resource

    user = create_or_update_user(canonical_data, user)
    authorization = create_or_update_authorization(canonical_data, user)

    user
  end

  def create_or_update_user(canonical_data, user=nil)
    authorization = nil

    #uid = canonical_data[:canonical][:uid] # very likely to be present
    #name = canonical_data[:canonical][:name] # might be present
    #email = canonical_data[:email] # good chance this won't be present
    #email_is_dummy = canonical_data[:dummy_email] # will be true or false

    # check uid and provider
    if user.blank? &&
        canonical_data[:authorization].include?(:uid) && !canonical_data[:authorization][:uid].blank? &&
        canonical_data[:authorization].include?(:provider) && !canonical_data[:authorization][:provider].blank?
      authorization = Authorization.where(uid: canonical_data[:authorization][:uid], provider: canonical_data[:authorization][:provider]).first
      unless authorization.blank?
        user = authorization.user
      end
    end

    # check name and provider
    if user.blank? &&
        canonical_data[:authorization].include?(:name) && !canonical_data[:authorization][:name].blank? &&
        canonical_data[:authorization].include?(:provider) && !canonical_data[:authorization][:provider].blank?
      authorization = Authorization.where(name: canonical_data[:authorization][:name], provider: canonical_data[:authorization][:provider]).first
      unless authorization.blank?
        user = authorization.user
      end
    end

    # if the email is given and isn't a dummy email, and the user doesn't have an email, set the email
    if user.blank? &&
        canonical_data[:user].include?(:is_fake_email) && !canonical_data[:user][:is_fake_email] &&
        canonical_data[:user].include?(:email) && !canonical_data[:user][:email].blank?
      user = User.find_by_email(canonical_data[:user][:email])
    end

    # can't find an existing user, create a new one
    if user.blank?
      # need: user_name, display_name, email, is_fake_email
      # display_name and user_name might be nil
      new_display_name = canonical_data[:user][:display_name].blank? ?
          -1 * Random.rand(100000) : canonical_data[:user][:display_name]

      new_user_name = canonical_data[:user][:user_name].blank? ?
          -1 * Random.rand(100000) :
          canonical_data[:user][:user_name].gsub(/[^0-9a-zA-Z]/, '_')+'_'+canonical_data[:authorization][:provider]

      # HACK: for users created by external providers, dummy the user name with the .... field
      user = User.create!(
          display_name: new_display_name,
          email: canonical_data[:user][:email],
          is_fake_email: canonical_data[:user][:is_fake_email],
          password: Devise.friendly_token[0, 20],
          user_name: new_user_name)
      user.user_name = "user#{user.id}" if canonical_data[:user][:user_name].blank?
      user.display_name = "user#{user.id}" if canonical_data[:user][:display_name].blank?
      user.save!
    end

    raise "Could not find or create a user for external provider information: #{canonical_data.to_json}" if user.blank?

    # this won't work, as not possible to set a blank display_name
    # update display_name if given and it was blank
    #if user.display_name.blank? && canonical_data[:user].include?(:display_name) && !canonical_data[:user][:display_name].blank?
    #  user.display_name = canonical_data[:display_name]
    #end

    # this won't work, as not possible to set a blank user_name
    # update user_name if given and it was blank
    #if user.display_name.blank? && canonical_data[:user].include?(:display_name) && !canonical_data[:user][:display_name].blank?
    #  user.display_name = canonical_data[:display_name]
    #end

    # update email if given and it was not a fake email and not blank
    if user.is_fake_email &&
        canonical_data[:user].include?(:is_fake_email) && !canonical_data[:user][:is_fake_email] &&
        canonical_data[:user].include?(:email) && !canonical_data[:user][:email].blank?
      user.email = canonical_data[:user][:email]
      user.is_fake_email = false
    end

    # this needs to be here to ensure existing users records are updated
    user.save!

    user
  end

  def create_or_update_authorization(canonical_data, user=nil)
    raise "Invalid data from provider." if canonical_data.blank?
    raise "Invalid user information." if user.blank?

    # need to find by provider and uid
    authorization = user.authorizations.where(provider: canonical_data[:authorization][:provider], uid: canonical_data[:authorization][:uid]).first
    if authorization.blank?
      authorization = user.authorizations.build(provider: canonical_data[:authorization][:provider])
      user.authorizations.push(authorization)
    end

    # update all auth attributes. This will remove info if it is not provided in canonical_data[:authorization].
    authorization.update_attributes! canonical_data[:authorization]

    authorization
  end

  def construct_post(endpoint_uri, body)
    post_request = Net::HTTP::Post.new(endpoint_uri.request_uri)
    post_request["Content-Type"] = "application/json"
    post_request["Accept"] = "application/json"
    post_request.body = body.to_json
    post_request
  end
end