class Api::ConfirmationsController < Devise::ConfirmationsController
  respond_to :json

  # GET /resource/confirmation/new
  def new
    resource = build_resource(params[:user])
    respond_with resource
  end


# POST /resource/confirmation
  def create
    attributes = params.include?(:user) ? params[:user] : {}

    self.resource = resource_class.send_confirmation_instructions(attributes)

    if successfully_sent?(resource)
      respond_with({}, :location => after_resending_confirmation_instructions_path_for(resource_name))
    else
      respond_with(resource)
    end
  end

end