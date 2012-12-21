class ApplicationController < ActionController::Base
  before_filter :authenticate_user!
  protect_from_forgery

  # CanCan permisisons
  # https://github.com/ryanb/cancan
  #check_authorization
  rescue_from CanCan::AccessDenied do |exception|
    #redirect_to root_url, :alert => exception.message
    render :json => Api::SessionsController.forbidden_info(current_user).to_json, :status => :forbidden
  end

  # userstamp
  include Userstamp

  # from http://stackoverflow.com/a/94626
  def render_csv(filename = nil)
    require 'csv'
    filename ||= params[:action]
    filename += '.csv'

    if request.env['HTTP_USER_AGENT'] =~ /msie/i
      headers['Pragma'] = 'public'
      headers["Content-type"] = "text/plain"
      headers['Cache-Control'] = 'no-cache, must-revalidate, post-check=0, pre-check=0'
      headers['Content-Disposition'] = "attachment; filename=\"#{filename}\""
      headers['Expires'] = "0"
    else
      headers["Content-Type"] ||= 'text/csv'
      headers["Content-Disposition"] = "attachment; filename=\"#{filename}\""
    end

    render :layout => false
  end

  private

  #def set_stamper
  #  User.stamper = current_user if user_signed_in?
  #end

  def set_stampers
    User.stamper = self.current_user
  end
end
