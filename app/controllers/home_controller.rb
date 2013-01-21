class HomeController < ApplicationController
  skip_before_filter :authenticate_user!
  skip_authorization_check :only => [:index]
  skip_authorize_resource :only => [:index]
  skip_load_resource :only => [:index]

  def index

    #the_search = Search.new( { :body_params => { :project_ids => [ 4 ],:site_ids => [ ],:audio_recording_ids => [  ] } } )
    #params[:test1] = the_search
    #params[:test2] = the_search.execute_query.all

    #raise RuntimeError

    the_format = params[:format]

    if the_format.blank?
      render
    else
      head :not_acceptable
    end
  end
end
