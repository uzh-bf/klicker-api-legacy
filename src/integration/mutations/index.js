const { loadAsString } = require('../../lib/utils')

const RegistrationMutation = loadAsString('./RegistrationMutation.graphql')
const LoginMutation = loadAsString('./LoginMutation.graphql')
const LogoutMutation = loadAsString('./LogoutMutation.graphql')
const CreateQuestionMutation = loadAsString('./CreateQuestionMutation.graphql')
const ModifyQuestionMutation = loadAsString('./ModifyQuestionMutation.graphql')
const ArchiveQuestionsMutation = loadAsString(
  './ArchiveQuestionsMutation.graphql',
)
const CreateSessionMutation = loadAsString('./CreateSessionMutation.graphql')
const StartSessionMutation = loadAsString('./StartSessionMutation.graphql')
const PauseSessionMutation = loadAsString('./PauseSessionMutation.graphql')
const EndSessionMutation = loadAsString('./EndSessionMutation.graphql')
const AddFeedbackMutation = loadAsString('./AddFeedbackMutation.graphql')
const DeleteFeedbackMutation = loadAsString('./DeleteFeedbackMutation.graphql')
const AddConfusionTSMutation = loadAsString('./AddConfusionTSMutation.graphql')
const UpdateSessionSettingsMutation = loadAsString(
  './UpdateSessionSettingsMutation.graphql',
)
const AddResponseMutation = loadAsString('./AddResponseMutation.graphql')
const ActivateNextBlockMutation = loadAsString(
  './ActivateNextBlockMutation.graphql',
)
const RequestPasswordMutation = loadAsString(
  './RequestPasswordMutation.graphql',
)
const ChangePasswordMutation = loadAsString('./ChangePasswordMutation.graphql')

const RegistrationSerializer = require('./RegistrationSerializer')
const ActivateNextBlockSerializer = require('./ActivateNextBlockSerializer')
const ArchiveQuestionsSerializer = require('./ArchiveQuestionsSerializer')
const ChangePasswordSerializer = require('./ChangePasswordSerializer')
const CreateQuestionSerializer = require('./CreateQuestionSerializer')
const CreateSessionSerializer = require('./CreateSessionSerializer')
const StartAndEndSessionSerializer = require('./StartAndEndSessionSerializer')
const UpdateSessionSettingsSerializer = require('./UpdateSessionSettingsSerializer')

module.exports = {
  RegistrationMutation,
  LoginMutation,
  LogoutMutation,
  CreateQuestionMutation,
  ModifyQuestionMutation,
  ArchiveQuestionsMutation,
  CreateSessionMutation,
  StartSessionMutation,
  PauseSessionMutation,
  EndSessionMutation,
  AddFeedbackMutation,
  DeleteFeedbackMutation,
  AddConfusionTSMutation,
  UpdateSessionSettingsMutation,
  AddResponseMutation,
  ActivateNextBlockMutation,
  RequestPasswordMutation,
  ChangePasswordMutation,
  serializers: [
    RegistrationSerializer,
    ActivateNextBlockSerializer,
    ArchiveQuestionsSerializer,
    ChangePasswordSerializer,
    CreateQuestionSerializer,
    CreateSessionSerializer,
    StartAndEndSessionSerializer,
    UpdateSessionSettingsSerializer,
  ],
}
