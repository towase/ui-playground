import { valibotResolver } from '@hookform/resolvers/valibot'
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useActionState } from 'react'
import { useForm } from 'react-hook-form'
import * as v from 'valibot'

const userRegistrationSchema = v.pipe(
  v.object({
    username: v.pipe(
      v.string('ユーザー名を入力してください'),
      v.minLength(3, 'ユーザー名は3文字以上である必要があります'),
      v.maxLength(20, 'ユーザー名は20文字以下である必要があります'),
    ),
    email: v.pipe(
      v.string('メールアドレスを入力してください'),
      v.email('有効なメールアドレスを入力してください'),
    ),
    password: v.pipe(
      v.string('パスワードを入力してください'),
      v.minLength(8, 'パスワードは8文字以上である必要があります'),
    ),
    confirmPassword: v.string('パスワード（確認）を入力してください'),
    age: v.pipe(
      v.number('年齢を入力してください'),
      v.integer('年齢は整数で入力してください'),
      v.minValue(13, '13歳以上である必要があります'),
      v.maxValue(120, '有効な年齢を入力してください'),
    ),
    country: v.pipe(
      v.picklist(
        ['japan', 'usa', 'uk', 'canada', 'australia', 'other'],
        '国を選択してください',
      ),
    ),
  }),
  v.forward(
    v.check(
      data => data.password === data.confirmPassword,
      'パスワードが一致しません',
    ),
    ['confirmPassword'],
  ),
)

type UserFormData = v.InferInput<typeof userRegistrationSchema>

interface ActionState {
  success: boolean
  message: string
  data?: UserFormData
}

async function submitUserRegistration(
  _prevState: ActionState,
  formData: UserFormData,
): Promise<ActionState> {
  try {
    const existingData = JSON.parse(
      localStorage.getItem('userRegistrations') || '[]',
    )
    const { confirmPassword, ...userData } = formData
    const newData = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
      validationLibrary: 'react-hook-form + valibot',
    }
    existingData.push(newData)
    localStorage.setItem('userRegistrations', JSON.stringify(existingData))

    return {
      success: true,
      message: 'ユーザー登録が完了しました',
      data: formData,
    }
  } catch (error) {
    return {
      success: false,
      message: 'データの保存に失敗しました',
    }
  }
}

export function FormReactHookFormValibot() {
  const [state, _formAction] = useActionState(submitUserRegistration, {
    success: false,
    message: '',
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UserFormData>({
    resolver: valibotResolver(userRegistrationSchema),
  })

  const onSubmit = async (data: UserFormData) => {
    const result = await submitUserRegistration(state, data)
    if (result.success) {
      reset()
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <TextField
        {...register('username')}
        label="ユーザー名"
        fullWidth={true}
        error={!!errors.username}
        helperText={errors.username?.message}
      />

      <TextField
        {...register('email')}
        label="メールアドレス"
        type="email"
        fullWidth={true}
        error={!!errors.email}
        helperText={errors.email?.message}
      />

      <TextField
        {...register('password')}
        label="パスワード"
        type="password"
        fullWidth={true}
        error={!!errors.password}
        helperText={errors.password?.message}
      />

      <TextField
        {...register('confirmPassword')}
        label="パスワード（確認）"
        type="password"
        fullWidth={true}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
      />

      <TextField
        {...register('age', { valueAsNumber: true })}
        label="年齢"
        type="number"
        fullWidth={true}
        error={!!errors.age}
        helperText={errors.age?.message}
        slotProps={{ htmlInput: { min: 13, max: 120 } }}
      />

      <FormControl fullWidth={true} error={!!errors.country}>
        <InputLabel>国</InputLabel>
        <Select {...register('country')} label="国" defaultValue="">
          <MenuItem value="japan">日本</MenuItem>
          <MenuItem value="usa">アメリカ</MenuItem>
          <MenuItem value="uk">イギリス</MenuItem>
          <MenuItem value="canada">カナダ</MenuItem>
          <MenuItem value="australia">オーストラリア</MenuItem>
          <MenuItem value="other">その他</MenuItem>
        </Select>
        <FormHelperText>{errors.country?.message}</FormHelperText>
      </FormControl>

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
      >
        ユーザー登録
      </Button>

      {state.message && (
        <Box
          sx={{
            p: 2,
            bgcolor: state.success ? 'success.light' : 'error.light',
            borderRadius: 1,
          }}
        >
          <Typography color={state.success ? 'success.dark' : 'error.dark'}>
            {state.message}
          </Typography>
          {state.success && state.data && (
            <Box sx={{ mt: 1 }}>
              <Chip
                label="React Hook Form + Valibot で検証済み"
                color="secondary"
                size="small"
              />
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                データはLocalStorageに保存されました
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
