class ApplicationController < ActionController::Base
  protect_from_forgery
  
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

  # temporarily enabled again
  def set_stamper
    #current_user should be provided by devise
    User.stamper = User.first! #  self.current_user
  end
end
