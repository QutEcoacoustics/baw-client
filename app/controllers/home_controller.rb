class HomeController < ApplicationController
  skip_before_filter :authenticate_user!
  skip_authorization_check :only => [:index]
  def index



    #the_search = Search.new( { :body_params => { :project_ids => [ 4 ],:site_ids => [ ],:audio_recording_ids => [  ] } } )
    #params[:test1] = the_search
    #params[:test2] = the_search.execute_query.all

    #raise RuntimeError
  end
end
