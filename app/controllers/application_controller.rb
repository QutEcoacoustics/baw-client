class ApplicationController < ActionController::Base
  protect_from_forgery
  
  # userstamp
  include Userstamp
  
  private 
  
  def set_stamper
    # current_user is from devise
    User.stamper =  self.current_user #User.first()
  end
end
