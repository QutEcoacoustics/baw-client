class ApplicationController < ActionController::Base
  protect_from_forgery
  
  # userstamp
  include Userstamp
  
  private 
  
  def set_stamper
    # I expect this to fail
    # hack while we have no authentication
    User.stamper =  User.first() #self.current_user
  end
end
