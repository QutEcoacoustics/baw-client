class RestFailureApp < Devise::FailureApp
  def respond
    if !request.format.blank? && request.format.to_s.include?('json')
      json_failure
    else
      super
    end
  end

  def json_failure
    self.status = 401
    self.content_type = 'application/json'
    self.response_body = Api::SessionsController.fail_login_info('Authentication error.',nil).to_json
  end
end